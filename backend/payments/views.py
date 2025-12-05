# payments/views.py
"""Module docstring for payment views handling different payment methods"""
import json
import base64
import logging
from datetime import datetime, timedelta
import requests
from django.db import DatabaseError, transaction, IntegrityError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views import View
from django.core.exceptions import ValidationError 
from django.db.models import Q
from django.utils import timezone
from .models import Payment, Subscription
from .utils import EsewaPaymentUtils

logger = logging.getLogger(__name__)



@method_decorator([csrf_exempt], name='dispatch')
class InitiatePaymentView(View):
    """Initiate payment process with different payment methods"""

    def post(self, request):
        """Handle payment initiation with idempotency support"""
        try:
            # Handle both JSON and form data
            if request.content_type == 'application/json':
                data = json.loads(request.body)
            else:
                data = request.POST.dict()
                
            payment_type = data.get('payment_type', 'cash')
            amount = float(data.get('amount', 5000.00))
            idempotency_key = data.get('idempotency_key')
            
            # Initialize user to None to avoid UnboundLocalError in exception handler
            user = None
            
            # For testing - use a test user if not authenticated
            if request.user.is_authenticated:
                user = request.user
            else:
                # Create or get a test user for unauthenticated requests
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user, created = User.objects.get_or_create(
                    email='test@example.com',
                    defaults={
                        'first_name': 'Test', 
                        'last_name': 'User',
                        'phone': '+977-9841234567'
                    }
                )
            
            # Use atomic transaction to handle race conditions
            with transaction.atomic():
                # Check for existing payment with same idempotency key
                if idempotency_key:
                    try:
                        existing_payment = Payment.objects.select_for_update(nowait=True).filter(
                            user=user,
                            idempotency_key=idempotency_key
                        ).first()
                        
                        if existing_payment:
                            # Return existing payment data (idempotent response)
                            logger.info(f"Returning existing payment for idempotency_key: {idempotency_key}")
                            return self._build_payment_response(existing_payment)
                    except DatabaseError:
                        # Another request is processing the same idempotency key
                        # Wait briefly and retry
                        pass
                
                # Create new payment record
                payment = Payment.objects.create(
                    user=user,
                    amount=amount,
                    tax_amount=0.00,
                    total_amount=amount,
                    payment_type=payment_type,
                    status='PENDING',
                    idempotency_key=idempotency_key
                )

            # Build and return payment response
            return self._build_payment_response(payment)

        except IntegrityError as ie:
            # Handle race condition where duplicate idempotency_key was inserted
            if idempotency_key and user:
                existing_payment = Payment.objects.filter(
                    user=user,
                    idempotency_key=idempotency_key
                ).first()
                if existing_payment:
                    return self._build_payment_response(existing_payment)
            logger.exception("Integrity error during payment initiation: %s", ie)
            return JsonResponse({'success': False, 'error': 'Duplicate payment request'}, status=409)
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON data'}, status=400)
        except ValidationError as ve:
            return JsonResponse({'success': False, 'error': f'Validation error: {str(ve)}'}, status=400)
        except DatabaseError as de:
            logger.exception("Database error while creating payment: %s", de)
            return JsonResponse({'success': False, 'error':
                                 'A database error occurred.'}, status=500)
        except AttributeError as ae:
            logger.exception("Missing attribute during signature generation: %s", ae)
            return JsonResponse({'success': False,
                                 'error': 'Internal configuration error.'}, status=500)
        except KeyError as ke:
            logger.exception("Missing expected setting or key %s", ke)
            return JsonResponse({'success': False, 'error':
                                 f'Missing config or data: {str(ke)}'}, status=500)
        #pylint: disable=broad-exception-caught
        except Exception as e:
            logger.exception("Unexpected error during payment initiation : %s", e)
            return JsonResponse({'success': False,
                                 'error': f'An unexpected error occurred: {str(e)}'}, status=500)

    def _build_payment_response(self, payment):
        """Build the appropriate response based on payment type"""
        if payment.payment_type == 'esewa':
            signature = EsewaPaymentUtils.generate_signature(
                total_amount=str(int(payment.total_amount)),
                transaction_uuid=payment.transaction_uuid,
                product_code=settings.ESEWA_PRODUCT_CODE
            )

            payment_data = {
                'amount': str(int(payment.amount)),
                'tax_amount': str(int(payment.tax_amount)),
                'total_amount': str(int(payment.total_amount)),
                'transaction_uuid': payment.transaction_uuid,
                'product_code': settings.ESEWA_PRODUCT_CODE,
                'product_service_charge': '0',
                'product_delivery_charge': '0',
                'success_url': f"{settings.FRONTEND_URL}/customer/place-order/checkout",
                'failure_url': f"{settings.FRONTEND_URL}/customer/place-order/checkout",
                'signed_field_names': 'total_amount,transaction_uuid,product_code',
                'signature': signature
            }

            return JsonResponse({
                'success': True,
                'payment_data': payment_data,
                'esewa_url': settings.ESEWA_PAYMENT_URL,
                'transaction_uuid': payment.transaction_uuid,
                'payment_type': 'esewa'
            })
            
        elif payment.payment_type == 'bank':
            # For bank payments, mark as pending and provide bank details
            return JsonResponse({
                'success': True,
                'transaction_uuid': payment.transaction_uuid,
                'payment_type': 'bank',
                'bank_details': {
                    'account_name': 'Laundry Management System',
                    'account_number': '1234567890',
                    'bank_name': 'Sample Bank',
                    'swift_code': 'SAMPLEBNK'
                }
            })
            
        else:  # cash payment
            # For cash payments, mark as completed immediately (COD)
            with transaction.atomic():
                payment = Payment.objects.select_for_update().get(pk=payment.pk)
                if payment.status == 'PENDING':
                    payment.status = 'COMPLETE'
                    payment.processed_at = timezone.now()
                    payment.save()
            
            return JsonResponse({
                'success': True,
                'transaction_uuid': payment.transaction_uuid,
                'payment_type': 'cash',
                'message': 'Cash on delivery order placed successfully'
            })


class PaymentSuccessView(View):
    """Handle successful payment response from eSewa"""
    def get(self, request):
        """Process successful payment with idempotency"""
        try:
            # Get the encoded data from query parameters
            data_param = request.GET.get('data')
            if not data_param:
                return JsonResponse({'success': False, 'error': 'No payment data received'})

            # Decode the base64 data
            decoded_data = base64.b64decode(data_param).decode('utf-8')
            payment_response = json.loads(decoded_data)

            # Verify signature
            signature = payment_response.get('signature')
            if not EsewaPaymentUtils.verify_signature(payment_response, signature):
                return JsonResponse({'success': False, 'error': 'Invalid signature'})

            transaction_uuid = payment_response.get('transaction_uuid')
            
            # Use atomic transaction with row locking to prevent race conditions
            with transaction.atomic():
                #pylint: disable=no-member
                payment = Payment.objects.select_for_update().get(transaction_uuid=transaction_uuid)
                
                # Idempotency check: if already processed, return success without re-processing
                if payment.status == 'COMPLETE' and payment.processed_at:
                    logger.info(f"Payment {transaction_uuid} already processed at {payment.processed_at}")
                    return JsonResponse({
                        'success': True,
                        'already_processed': True,
                        'payment': {
                            'transaction_uuid': payment.transaction_uuid,
                            'transaction_code': payment.transaction_code,
                            'status': payment.status,
                            'amount': float(payment.total_amount)
                        }
                    })

                # Update payment status
                payment.status = payment_response.get('status', 'COMPLETE')
                payment.transaction_code = payment_response.get('transaction_code')
                payment.processed_at = timezone.now()
                payment.save()

                # Create or update subscription if payment is complete
                if payment.status == 'COMPLETE':
                    self._update_subscription(payment)

            return JsonResponse({
                'success': True,
                'payment': {
                    'transaction_uuid': payment.transaction_uuid,
                    'transaction_code': payment.transaction_code,
                    'status': payment.status,
                    'amount': float(payment.total_amount)
                }
            })

        except Exception as e:
            from django.core.exceptions import ObjectDoesNotExist
            if isinstance(e, ObjectDoesNotExist):
                return JsonResponse({'success': False, 'error': 'Payment not found'})
            logger.exception("Error in PaymentSuccessView: %s", e)
            return JsonResponse({'success': False, 'error': str(e)})

    def _update_subscription(self, payment):
        """Create or update subscription for the user"""
        # pylint: disable=no-member
        subscription, created = Subscription.objects.get_or_create(
            user=payment.user,
            defaults={
                'payment': payment,
                'is_active': True,
                'start_date': timezone.now(),
                'end_date': timezone.now() + timedelta(days=365)  # 1 year subscription
            }
        )

        if not created:
            subscription.payment = payment
            subscription.is_active = True
            subscription.start_date = timezone.now()
            subscription.end_date = timezone.now() + timedelta(days=365)
            subscription.save()


@method_decorator([csrf_exempt], name='dispatch')
class VerifyEsewaPaymentView(View):
    """Verify eSewa payment from frontend with idempotency"""
    def post(self, request):
        """Verify and process eSewa payment parameters"""
        try:
            data = json.loads(request.body)
            
            # Support both old (oid, amt, refId) and new (transaction_uuid, transaction_code, amount) params
            transaction_uuid = data.get('transaction_uuid') or data.get('oid')
            amount = data.get('amount') or data.get('amt')
            ref_id = data.get('transaction_code') or data.get('refId')
            
            if not all([transaction_uuid, amount]):
                return JsonResponse({
                    'success': False, 
                    'error': 'Missing required eSewa parameters'
                })
            
            # Use atomic transaction with row locking
            with transaction.atomic():
                payment = Payment.objects.select_for_update().get(transaction_uuid=transaction_uuid)
                
                # Idempotency check: if already processed, return success
                if payment.status == 'COMPLETE' and payment.processed_at:
                    logger.info(f"Payment {transaction_uuid} already verified at {payment.processed_at}")
                    return JsonResponse({
                        'success': True,
                        'already_processed': True,
                        'payment': {
                            'transaction_uuid': payment.transaction_uuid,
                            'ref_id': payment.ref_id,
                            'status': payment.status,
                            'amount': float(payment.total_amount)
                        }
                    })
                
                # Verify the amount matches
                if float(amount) != float(payment.total_amount):
                    return JsonResponse({
                        'success': False, 
                        'error': 'Payment amount mismatch'
                    })
                
                # Update payment status
                payment.status = 'COMPLETE'
                payment.ref_id = ref_id
                payment.processed_at = timezone.now()
                payment.save()
                
                # Create or update subscription
                self._update_subscription(payment)
            
            return JsonResponse({
                'success': True,
                'payment': {
                    'transaction_uuid': payment.transaction_uuid,
                    'ref_id': payment.ref_id,
                    'status': payment.status,
                    'amount': float(payment.total_amount)
                }
            })
            
        except Payment.DoesNotExist:
            return JsonResponse({
                'success': False, 
                'error': 'Payment record not found'
            })
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False, 
                'error': 'Invalid JSON data'
            })
        except Exception as e:
            logger.exception("Error verifying eSewa payment: %s", e)
            return JsonResponse({
                'success': False, 
                'error': f'Payment verification failed: {str(e)}'
            })

    def _update_subscription(self, payment):
        """Create or update subscription for the user"""
        subscription, created = Subscription.objects.get_or_create(
            user=payment.user,
            defaults={
                'payment': payment,
                'is_active': True,
                'start_date': timezone.now(),
                'end_date': timezone.now() + timedelta(days=365)
            }
        )

        if not created:
            subscription.payment = payment
            subscription.is_active = True
            subscription.start_date = timezone.now()
            subscription.end_date = timezone.now() + timedelta(days=365)
            subscription.save()


class PaymentFailureView(View):
    """Payment failure"""
    def get(self, request):
        """Handles payment failure with idempotency"""
        transaction_uuid = request.GET.get('transaction_uuid')
        if transaction_uuid:
            try:
                with transaction.atomic():
                    # pylint:disable=no-member
                    payment = Payment.objects.select_for_update().get(transaction_uuid=transaction_uuid)
                    # Only update if not already processed
                    if payment.status == 'PENDING':
                        payment.status = 'FAILED'
                        payment.processed_at = timezone.now()
                        payment.save()
            except Payment.DoesNotExist:
                pass

        return JsonResponse({
            'success': False,
            'error': 'Payment failed or was cancelled'
        })


class CheckPaymentStatusView(View):
    """Permission Status Checked"""
    def get(self, request, transaction_uuid):
        """Check the status of the payment with locking"""
        try:
            with transaction.atomic():
                #pylint: disable=no-member
                payment = Payment.objects.select_for_update().get(transaction_uuid=transaction_uuid)

                # If already complete, return cached status
                if payment.status == 'COMPLETE':
                    return JsonResponse({
                        'success': True,
                        'status': payment.status,
                        'ref_id': payment.ref_id
                    })

                # Check status with eSewa API
                status_url = f"{settings.ESEWA_STATUS_CHECK_URL}?product_code={settings.ESEWA_PRODUCT_CODE}&total_amount={int(payment.total_amount)}&transaction_uuid={transaction_uuid}"

                response = requests.get(status_url, timeout=10)

                if response.status_code == 200:
                    status_data = response.json()

                    # Update payment status
                    new_status = status_data.get('status', 'PENDING')
                    if payment.status != new_status:
                        payment.status = new_status
                        payment.ref_id = status_data.get('ref_id')
                        if new_status == 'COMPLETE':
                            payment.processed_at = timezone.now()
                        payment.save()

                    # Update subscription if payment is complete
                    if payment.status == 'COMPLETE':
                        subscription, created = Subscription.objects.get_or_create(
                            user=payment.user,
                            defaults={
                                'payment': payment,
                                'is_active': True,
                                'start_date': timezone.now(),
                                'end_date': timezone.now() + timedelta(days=365)
                            }
                        )

                    return JsonResponse({
                        'success': True,
                        'status': payment.status,
                        'ref_id': payment.ref_id
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'error': 'Failed to check payment status'
                    })

        except Payment.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Payment not found'})
        except Exception as e:
            logger.exception("Error checking payment status: %s", e)
            return JsonResponse({'success': False, 'error': str(e)})


@login_required
def user_subscription_status(request):
    """Get current user's subscription status"""
    try:
        #pylint: disable=no-member
        subscription = Subscription.objects.get(user=request.user, is_active=True)
        return JsonResponse({
            'success': True,
            'subscription': {
                'is_active': subscription.is_active,
                'start_date': subscription.start_date,
                'end_date': subscription.end_date,
                'payment_amount': float(subscription.payment.total_amount)
            }
        })
    except Subscription.DoesNotExist:
        return JsonResponse({
            'success': True,
            'subscription': None
        })


@login_required
def payment_history(request):
    """Get user's payment history with search and filtering"""
    try:
        # Get query parameters
        search = request.GET.get('search', '')
        payment_type = request.GET.get('payment_type', '')
        status = request.GET.get('status', '')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        
        # Build query
        payments = Payment.objects.filter(user=request.user).order_by('-created_at')
        
        # Apply filters
        if search:
            payments = payments.filter(
                Q(transaction_uuid__icontains=search) |
                Q(transaction_code__icontains=search) |
                Q(ref_id__icontains=search)
            )
        
        if payment_type:
            payments = payments.filter(payment_type=payment_type)
            
        if status:
            payments = payments.filter(status=status)
        
        # Paginate
        from django.core.paginator import Paginator
        paginator = Paginator(payments, page_size)
        page_obj = paginator.get_page(page)
        
        # Serialize payments
        payments_data = []
        for payment in page_obj:
            payments_data.append({
                'id': payment.id,
                'transaction_uuid': payment.transaction_uuid,
                'transaction_code': payment.transaction_code,
                'amount': float(payment.amount),
                'tax_amount': float(payment.tax_amount),
                'total_amount': float(payment.total_amount),
                'payment_type': payment.payment_type,
                'status': payment.status,
                'ref_id': payment.ref_id,
                'created_at': payment.created_at.isoformat(),
                'updated_at': payment.updated_at.isoformat(),
            })
        
        return JsonResponse({
            'success': True,
            'payments': payments_data,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        })
        
    except Exception as e:
        logger.exception("Error fetching payment history: %s", e)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch payment history'
        }, status=500)
