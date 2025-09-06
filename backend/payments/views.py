# payments/views.py
"""Module docstring for payment views handling different payment methods"""
import json
import logging
from datetime import datetime, timedelta
import requests
from django.db import DatabaseError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views import View
from django.core.exceptions import ValidationError 
from django.db.models import Q
from .models import Payment, Subscription
from .utils import EsewaPaymentUtils

logger = logging.getLogger(__name__)



@method_decorator([csrf_exempt], name='dispatch')
class InitiatePaymentView(View):
    """Initiate payment process with different payment methods"""

    def post(self, request):
        """Handle payment initiation"""
        try:
            # Handle both JSON and form data
            if request.content_type == 'application/json':
                data = json.loads(request.body)
            else:
                data = request.POST.dict()
                
            payment_type = data.get('payment_type', 'cash')
            amount = float(data.get('amount', 5000.00))
            # order_id can be used for linking payment to specific order
            
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
            
            # Create payment record
            payment = Payment.objects.create(
                user=user,
                amount=amount,
                tax_amount=0.00,
                total_amount=amount,
                payment_type=payment_type,
                status='PENDING'
            )

            # Handle different payment types
            if payment_type == 'esewa':
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
                    'success_url': f"{settings.BACKEND_URL}/payment/success/",
                    'failure_url': f"{settings.FRONTEND_URL}/place-orders/failure",
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
                
            elif payment_type == 'bank':
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
                payment.status = 'COMPLETE'
                payment.save()
                
                return JsonResponse({
                    'success': True,
                    'transaction_uuid': payment.transaction_uuid,
                    'payment_type': 'cash',
                    'message': 'Cash on delivery order placed successfully'
                })

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

class PaymentSuccessView(View):
    """Handle successful payment response from eSewa"""
    def get(self, request):
        """Process successful payment"""
        try:
            # Get eSewa parameters from query string
            oid = request.GET.get('oid')  # transaction_uuid
            amt = request.GET.get('amt')  # amount
            refId = request.GET.get('refId')  # eSewa reference ID
            
            if not all([oid, amt, refId]):
                # Redirect to failure page if missing parameters
                from django.shortcuts import redirect
                return redirect(f"{settings.FRONTEND_URL}/place-orders/failure?reason=Missing payment parameters")

            try:
                # Find the payment record
                payment = Payment.objects.get(transaction_uuid=oid)
                
                # Verify the amount matches
                if float(amt) != float(payment.total_amount):
                    from django.shortcuts import redirect
                    return redirect(f"{settings.FRONTEND_URL}/place-orders/failure?reason=Payment amount mismatch")
                
                # Update payment status
                payment.status = 'COMPLETE'
                payment.ref_id = refId
                payment.save()
                
                # Create or update subscription if payment is complete
                subscription, created = Subscription.objects.get_or_create(
                    user=payment.user,
                    defaults={
                        'payment': payment,
                        'is_active': True,
                        'start_date': datetime.now(),
                        'end_date': datetime.now() + timedelta(days=365)  # 1 year subscription
                    }
                )

                if not created:
                    subscription.payment = payment
                    subscription.is_active = True
                    subscription.start_date = datetime.now()
                    subscription.end_date = datetime.now() + timedelta(days=365)
                    subscription.save()

                # Redirect to frontend confirmation page with payment details
                from django.shortcuts import redirect
                confirmation_url = f"{settings.FRONTEND_URL}/place-orders/confirmation?orderId={oid}&paymentRef={refId}&amount={amt}&paymentMethod=esewa"
                return redirect(confirmation_url)
                
            except Payment.DoesNotExist:
                from django.shortcuts import redirect
                return redirect(f"{settings.FRONTEND_URL}/place-orders/failure?reason=Payment record not found")

        except Exception as e:
            logger.exception("Error processing eSewa payment success: %s", e)
            from django.shortcuts import redirect
            return redirect(f"{settings.FRONTEND_URL}/place-orders/failure?reason=Payment processing failed")


@method_decorator([csrf_exempt], name='dispatch')
class VerifyEsewaPaymentView(View):
    """Verify eSewa payment from frontend"""
    def post(self, request):
        """Verify and process eSewa payment parameters"""
        try:
            data = json.loads(request.body)
            
            # Get eSewa parameters
            oid = data.get('oid')  # transaction_uuid
            amt = data.get('amt')  # amount
            refId = data.get('refId')  # eSewa reference ID
            order_data = data.get('orderData')  # Order data for automatic order creation
            
            if not all([oid, amt, refId]):
                return JsonResponse({
                    'success': False, 
                    'error': 'Missing required eSewa parameters'
                })
            
            # Find the payment record
            payment = Payment.objects.get(transaction_uuid=oid)
            
            # Verify the amount matches
            if float(amt) != float(payment.total_amount):
                return JsonResponse({
                    'success': False, 
                    'error': 'Payment amount mismatch'
                })
            
            # Update payment status
            payment.status = 'COMPLETE'
            payment.ref_id = refId
            payment.save()
            
            # Create or update subscription if payment is complete
            subscription, created = Subscription.objects.get_or_create(
                user=payment.user,
                defaults={
                    'payment': payment,
                    'is_active': True,
                    'start_date': datetime.now(),
                    'end_date': datetime.now() + timedelta(days=365)
                }
            )

            if not created:
                subscription.payment = payment
                subscription.is_active = True
                subscription.start_date = datetime.now()
                subscription.end_date = datetime.now() + timedelta(days=365)
                subscription.save()
            
            response_data = {
                'success': True,
                'payment': {
                    'transaction_uuid': payment.transaction_uuid,
                    'ref_id': payment.ref_id,
                    'status': payment.status,
                    'amount': float(payment.total_amount)
                }
            }
            
            # If order data is provided, automatically create the order
            if order_data:
                try:
                    from orders.serializers import OrderCreateSerializer
                    
                    # Prepare order data for creation
                    order_create_data = {
                        'user': payment.user.id,
                        'branch': order_data.get('branch'),
                        'services': order_data.get('cart', []),
                        'pickup_enabled': order_data.get('services', {}).get('pickupEnabled', False),
                        'delivery_enabled': order_data.get('services', {}).get('deliveryEnabled', False),
                        'pickup_date': order_data.get('pickup', {}).get('date') if order_data.get('pickup') else None,
                        'pickup_time': order_data.get('pickup', {}).get('time') if order_data.get('pickup') else None,
                        'pickup_address': order_data.get('pickup', {}).get('address') if order_data.get('pickup') else None,
                        'pickup_map_link': order_data.get('pickup', {}).get('map_link') if order_data.get('pickup') else None,
                        'delivery_date': order_data.get('delivery', {}).get('date') if order_data.get('delivery') else None,
                        'delivery_time': order_data.get('delivery', {}).get('time') if order_data.get('delivery') else None,
                        'delivery_address': order_data.get('delivery', {}).get('address') if order_data.get('delivery') else None,
                        'delivery_map_link': order_data.get('delivery', {}).get('map_link') if order_data.get('delivery') else None,
                        'is_urgent': order_data.get('services', {}).get('isUrgent', False),
                        'total_amount': order_data.get('pricing', {}).get('total', amt),
                        'payment_method': 'esewa',
                        'payment_status': 'paid',
                        'description': f'eSewa Payment - Transaction ID: {refId}'
                    }
                    
                    # Create the order using the serializer
                    serializer = OrderCreateSerializer(data=order_create_data)
                    if serializer.is_valid():
                        order = serializer.save()
                        response_data['order'] = {
                            'order_id': str(order.order_id),
                            'created': True
                        }
                    else:
                        response_data['order'] = {
                            'created': False,
                            'errors': serializer.errors
                        }
                        
                except Exception as e:
                    logger.error(f"Error creating order after payment: {str(e)}")
                    response_data['order'] = {
                        'created': False,
                        'error': str(e)
                    }
            
            return JsonResponse(response_data)
            
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

class PaymentFailureView(View):
    """Payment failure"""
    def get(self, request):
        """Handles paument failure"""
        # Handle payment failure
        transaction_uuid = request.GET.get('transaction_uuid')
        if transaction_uuid:
            try:
                # pylint:disable=no-member
                payment = Payment.objects.get(transaction_uuid=transaction_uuid)
                payment.status = 'FAILED'
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
        """Check the status of the payment"""
        try:
            #pylint: disable=no-member
            payment = Payment.objects.get(transaction_uuid=transaction_uuid)

            # Check status with eSewa API
            status_url = f"{settings.ESEWA_STATUS_CHECK_URL}?product_code={settings.ESEWA_PRODUCT_CODE}&total_amount={int(payment.total_amount)}&transaction_uuid={transaction_uuid}"

            response = requests.get(status_url, timeout=10)

            if response.status_code == 200:
                status_data = response.json()

                # Update payment status
                payment.status = status_data.get('status', 'PENDING')
                payment.ref_id = status_data.get('ref_id')
                payment.save()

                # Update subscription if payment is complete
                if payment.status == 'COMPLETE':
                    subscription, created = Subscription.objects.get_or_create(
                        user=payment.user,
                        defaults={
                            'payment': payment,
                            'is_active': True,
                            'start_date': datetime.now(),
                            'end_date': datetime.now() + timedelta(days=365)
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
