# payments/views.py
"""Module docstring for payment views handling different payment methods"""
import json
import base64
import logging
from datetime import datetime, timedelta
import requests
from django.db import DatabaseError, transaction, IntegrityError, models
from django.http import JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views import View
from django.core.exceptions import ValidationError 
from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Payment, Subscription
from orders.models import Order, OrderPayment
from branches.models import Branch
from .utils import EsewaPaymentUtils

logger = logging.getLogger(__name__)


@method_decorator([csrf_exempt], name='dispatch')
class InitiatePaymentView(APIView):
    """Initiate payment process with different payment methods"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Handle payment initiation with idempotency support and validation"""
        try:
            from .serializers import PaymentInitiateSerializer
            
            logger.info(f"[PAYMENT_INITIATE] Received payment initiation request")
            
            # Handle both JSON and form data
            if request.content_type == 'application/json':
                data = json.loads(request.body)
            else:
                data = request.POST.dict()
            
            # Validate input data using serializer
            serializer = PaymentInitiateSerializer(data=data)
            if not serializer.is_valid():
                logger.warning(f"[PAYMENT_INITIATE] Validation failed: {serializer.errors}")
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            validated_data = serializer.validated_data
            payment_type = validated_data['payment_type']
            amount = validated_data['amount']
            branch_id = validated_data['branch_id']
            idempotency_key = validated_data.get('idempotency_key')
            
            # Generate idempotency key if not provided
            if not idempotency_key:
                import uuid
                idempotency_key = f"payment-{uuid.uuid4()}"
                logger.info(f"[PAYMENT_INITIATE] Generated idempotency key: {idempotency_key}")
            
            # Use authenticated user
            user = request.user
            
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
                payment_source = validated_data.get('payment_source', 'payment_page')
                order_data = validated_data.get('order_data')
                
                logger.info(f"[PAYMENT_INITIATE] Creating payment - User: {user.email}, Amount: Rs.{amount}, Type: {payment_type}, Branch ID: {branch_id}, Source: {payment_source}")
                
                payment_kwargs = {
                    'user': user,
                    'amount': amount,
                    'tax_amount': 0.00,
                    'total_amount': amount,
                    'payment_type': payment_type,
                    'status': 'PENDING',
                    'branch_id': branch_id,
                    'idempotency_key': idempotency_key,
                    'payment_source': payment_source
                }
                
                # Store order_data if this is an order placement payment
                if payment_source == 'order' and order_data:
                    payment_kwargs['order_data'] = order_data
                    logger.info(f"[PAYMENT_INITIATE] Storing order data for post-payment order creation")
                
                payment = Payment.objects.create(**payment_kwargs)
                logger.info(f"[PAYMENT_INITIATE] Payment created successfully - Transaction UUID: {payment.transaction_uuid}")

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
            return Response({'success': False, 'error': 'Duplicate payment request'}, status=status.HTTP_409_CONFLICT)
        except json.JSONDecodeError:
            return Response({'success': False, 'error': 'Invalid JSON data'}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as ve:
            return Response({'success': False, 'error': f'Validation error: {str(ve)}'}, status=status.HTTP_400_BAD_REQUEST)
        except DatabaseError as de:
            logger.exception("Database error while creating payment: %s", de)
            return Response({'success': False, 'error':
                                 'A database error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except AttributeError as ae:
            logger.exception("Missing attribute during signature generation: %s", ae)
            return Response({'success': False,
                                 'error': 'Internal configuration error.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except KeyError as ke:
            logger.exception("Missing expected setting or key %s", ke)
            return Response({'success': False, 'error':
                                 f'Missing config or data: {str(ke)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        #pylint: disable=broad-exception-caught
        except Exception as e:
            logger.exception("Unexpected error during payment initiation : %s", e)
            return Response({'success': False,
                                 'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _build_payment_response(self, payment):
        """Build the appropriate response based on payment type"""
        if payment.payment_type == 'esewa':
            # Set success/failure URLs based on payment source
            if payment.payment_source == 'order':
                success_url = f"{settings.FRONTEND_URL}/customer/orders/success"
                failure_url = f"{settings.FRONTEND_URL}/customer/orders/failure"
            else:  # payment_page
                success_url = f"{settings.FRONTEND_URL}/customer/payment/success"
                failure_url = f"{settings.FRONTEND_URL}/customer/payment/failure"
            
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
                'success_url': success_url,
                'failure_url': failure_url,
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


class ProcessPaymentView(View):
    """Process completed payment and distribute across pending orders"""
    
    def post(self, request, transaction_uuid):
        """Process payment atomically with order updates"""
        try:
            # Validate transaction_uuid parameter
            if not transaction_uuid:
                logger.error("[PAYMENT_PROCESS] Missing transaction_uuid parameter")
                return JsonResponse({
                    'success': False,
                    'error': 'Transaction ID is required'
                }, status=400)
            
            logger.info(f"[PAYMENT_PROCESS] Starting payment processing for transaction: {transaction_uuid}")
            
            # Use atomic transaction to ensure consistency
            with transaction.atomic():
                # Lock the payment record
                try:
                    payment = Payment.objects.select_for_update().get(
                        transaction_uuid=transaction_uuid
                    )
                except Payment.DoesNotExist:
                    logger.error(f"[PAYMENT_PROCESS] Payment not found: {transaction_uuid}")
                    return JsonResponse({
                        'success': False,
                        'error': f'Payment not found for transaction ID: {transaction_uuid}'
                    }, status=404)
                
                logger.info(f"[PAYMENT_PROCESS] Payment found - User: {payment.user.email}, Amount: {payment.total_amount}, Branch: {payment.branch.name if payment.branch else 'N/A'}")
                
                # Idempotency check: if already processed, return success
                if payment.status == 'COMPLETE' and payment.processed_at:
                    logger.info(f"[PAYMENT_PROCESS] Payment {transaction_uuid} already processed at {payment.processed_at} - returning cached result")
                    return self._get_payment_receipt(payment)
                
                # Check if this is an order placement payment
                created_order = None
                if payment.payment_source == 'order' and payment.order_data:
                    logger.info(f"[PAYMENT_PROCESS] Creating order from payment order_data")
                    created_order = self._create_order_from_payment(payment)
                    if created_order:
                        logger.info(f"[PAYMENT_PROCESS] Order created successfully: {created_order.order_id}")
                
                # Get user's unpaid orders (pending AND partially paid) for the payment's branch
                from orders.models import Order, OrderPayment
                
                # Get orders that are not fully paid (pending OR partially_paid)
                unpaid_orders = Order.objects.select_for_update().filter(
                    customer_name=payment.user,
                    payment_status__in=['pending', 'partially_paid']
                )
                
                # Filter by branch if specified
                if payment.branch:
                    unpaid_orders = unpaid_orders.filter(branch=payment.branch)
                    logger.info(f"[PAYMENT_PROCESS] Filtering orders for branch: {payment.branch.name}")
                
                # Order by date (oldest first)
                unpaid_orders = unpaid_orders.order_by('order_date')
                
                logger.info(f"[PAYMENT_PROCESS] Found {unpaid_orders.count()} unpaid orders for processing")
                
                # Check if there are no unpaid orders for this branch
                if unpaid_orders.count() == 0 and payment.branch:
                    logger.info(f"[PAYMENT_PROCESS] No unpaid orders found for branch {payment.branch.name}. This will be recorded as an advance payment.")
                
                # Distribute payment across orders
                remaining_amount = payment.total_amount
                orders_paid = []
                
                # If this is a payment specifically for an order (via order_data), prioritize that order
                target_order = None
                if payment.payment_source == 'order' and created_order:
                    target_order = created_order
                    logger.info(f"[PAYMENT_PROCESS] Prioritizing newly created order {target_order.order_id}")
                
                for order in unpaid_orders:
                    if remaining_amount <= 0:
                        logger.info(f"[PAYMENT_PROCESS] Payment amount fully distributed, stopping")
                        break                    
                    # Skip orders that are not the target order (if we have a target)
                    if target_order and order.order_id != target_order.order_id:
                        logger.debug(f"[PAYMENT_PROCESS] Skipping order {order.order_id} as it's not the target order")
                        continue
                    
                    order_pending = order.total_amount
                    
                    # Check if order already has partial payments
                    existing_payments = OrderPayment.objects.filter(order=order).aggregate(
                        total_paid=models.Sum('amount_applied')
                    )
                    already_paid = existing_payments['total_paid'] or 0
                    order_pending -= already_paid
                    
                    if order_pending <= 0:
                        logger.debug(f"[PAYMENT_PROCESS] Order {order.order_id} already fully paid, skipping")
                        continue
                    
                    # Apply payment to this order
                    amount_to_apply = min(remaining_amount, order_pending)
                    
                    logger.info(f"[PAYMENT_PROCESS] Applying Rs.{amount_to_apply} to order {order.order_id} (Total: Rs.{order.total_amount}, Already Paid: Rs.{already_paid})")
                    
                    # Create OrderPayment record
                    OrderPayment.objects.create(
                        order=order,
                        payment=payment,
                        amount_applied=amount_to_apply
                    )
                    
                    remaining_amount -= amount_to_apply
                    
                    # Update order payment status
                    total_paid_for_order = already_paid + amount_to_apply
                    old_status = order.payment_status
                    
                    if total_paid_for_order >= order.total_amount:
                        order.payment_status = 'paid'
                    elif total_paid_for_order > 0:
                        order.payment_status = 'partially_paid'
                    else:
                        order.payment_status = 'pending'
                    
                    # If this payment is via eSewa and order was originally COD, update payment method
                    if payment.payment_type == 'esewa' and order.payment_method == 'cash':
                        old_payment_method = order.payment_method
                        order.payment_method = 'esewa'
                        logger.info(f"[PAYMENT_PROCESS] Updated order {order.order_id} payment method from {old_payment_method} to {order.payment_method}")
                    
                    order.save()
                    
                    logger.info(f"[PAYMENT_PROCESS] Order {order.order_id} status updated: {old_status} -> {order.payment_status}")
                    
                    orders_paid.append({
                        'order_id': str(order.order_id),
                        'amount_applied': float(amount_to_apply),
                        'order_total': float(order.total_amount),
                        'status': order.payment_status
                    })
                
                # Mark payment as complete
                if payment.status != 'COMPLETE':
                    old_status = payment.status
                    payment.status = 'COMPLETE'
                    payment.processed_at = timezone.now()
                    payment.save()
                    logger.info(f"[PAYMENT_PROCESS] Payment status updated: {old_status} -> COMPLETE at {payment.processed_at}")
                
                logger.info(f"[PAYMENT_PROCESS] Payment processing completed successfully - {len(orders_paid)} orders updated, Remaining amount: Rs.{remaining_amount}")
                
                return self._get_payment_receipt(payment, orders_paid)
                
        except DatabaseError as e:
            # Handle database locking errors
            error_msg = str(e).lower()
            if 'locked' in error_msg or 'database is locked' in error_msg:
                logger.warning(f"[PAYMENT_PROCESS] Database locked for transaction: {transaction_uuid}")
                
                # Try to check if payment was already processed (read-only)
                try:
                    payment = Payment.objects.get(transaction_uuid=transaction_uuid)
                    if payment.status == 'COMPLETE' and payment.processed_at:
                        logger.info(f"[PAYMENT_PROCESS] Payment {transaction_uuid} was already processed")
                        return self._get_payment_receipt(payment)
                except Payment.DoesNotExist:
                    pass
                
                return JsonResponse({
                    'success': False,
                    'error': 'Database is temporarily busy. Your payment may have been processed. Please refresh the page.',
                    'retry_suggested': True
                }, status=503)
            else:
                logger.exception(f"[PAYMENT_PROCESS] Database error: {e}")
                return JsonResponse({
                    'success': False,
                    'error': f'Database error: {str(e)}'
                }, status=500)
        except Exception as e:
            logger.exception(f"[PAYMENT_PROCESS] Error processing payment {transaction_uuid}: %s", e)
            return JsonResponse({
                'success': False,
                'error': f'Payment processing failed: {str(e)}'
            }, status=500)
    
    def _get_payment_receipt(self, payment, orders_paid=None):
        """Generate payment receipt response"""
        from orders.models import OrderPayment
        
        # If orders_paid not provided, fetch from database
        if orders_paid is None:
            order_payments = OrderPayment.objects.filter(payment=payment).select_related('order')
            orders_paid = [{
                'order_id': str(op.order.order_id),
                'amount_applied': float(op.amount_applied),
                'order_total': float(op.order.total_amount),
                'status': op.order.payment_status
            } for op in order_payments]
        
        return JsonResponse({
            'success': True,
            'payment': {
                'transaction_uuid': payment.transaction_uuid,
                'transaction_code': payment.transaction_code,
                'status': payment.status,
                'total_amount': float(payment.total_amount),
                'payment_type': payment.payment_type,
                'branch_name': payment.branch.name if payment.branch else None,
                'created_at': payment.created_at.isoformat(),
                'processed_at': payment.processed_at.isoformat() if payment.processed_at else None,
                'orders_paid': orders_paid
            }
        })
    
    def _create_order_from_payment(self, payment):
        """Create order from payment order_data"""
        from orders.models import Order, OrderItem, Delivery

        try:
            order_data = payment.order_data
            if not order_data:
                logger.error("[PAYMENT_PROCESS] No order_data found in payment")
                return None
            
            # Create the order
            order = Order.objects.create(
                customer_name=payment.user,
                branch_id=order_data.get('branch'),
                pickup_enabled=order_data.get('pickup_enabled', False),
                delivery_enabled=order_data.get('delivery_enabled', False),
                is_urgent=order_data.get('is_urgent', False),
                total_amount=order_data.get('total_amount'),
                payment_method=order_data.get('payment_method', 'esewa'),
                payment_status='paid',  # Payment is already complete
                status='pending pickup' if order_data.get('pickup_enabled') else 'pending',
                description=order_data.get('description', '')
            )
            
            # Create order items
            for service in order_data.get('services', []):
                OrderItem.objects.create(
                    order=order,
                    service_type=service.get('service_type'),
                    material=service.get('material'),
                    quantity=service.get('quantity'),
                    pricing_type=service.get('pricing_type', 'individual'),
                    price_per_unit=service.get('price_per_unit'),
                    total_price=service.get('total_price')
                )
            
            # Create pickup delivery if enabled
            if order_data.get('pickup_enabled') and order_data.get('pickup_address'):
                Delivery.objects.create(
                    order=order,
                    delivery_type='pickup',
                    delivery_address=order_data.get('pickup_address'),
                    delivery_contact=payment.user.phone,
                    delivery_time=order_data.get('pickup_time', 'evening'),
                    status='pending'
                )
            
            # Create drop-off delivery if enabled
            if order_data.get('delivery_enabled') and order_data.get('delivery_address'):
                Delivery.objects.create(
                    order=order,
                    delivery_type='drop',
                    delivery_address=order_data.get('delivery_address'),
                    delivery_contact=payment.user.phone,
                    delivery_time=order_data.get('delivery_time', 'evening'),
                    status='pending'
                )
            
            # Link payment to order
            from orders.models import OrderPayment
            OrderPayment.objects.create(
                order=order,
                payment=payment,
                amount_applied=payment.total_amount
            )
            
            return order
            
        except Exception as e:
            logger.exception(f"[PAYMENT_PROCESS] Error creating order from payment data: %s", e)
            return None



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
                    # For order payments, redirect to order success page with transaction UUID
                    if payment.payment_source == 'order':
                        success_redirect_url = f"{settings.FRONTEND_URL}/customer/orders/success?transaction_uuid={transaction_uuid}"
                        return HttpResponseRedirect(success_redirect_url)
                    else:
                        # For payment page payments, redirect to payment success page
                        success_redirect_url = f"{settings.FRONTEND_URL}/customer/payment/success?transaction_uuid={transaction_uuid}"
                        return HttpResponseRedirect(success_redirect_url)

                # Update payment status
                payment.status = payment_response.get('status', 'COMPLETE')
                payment.transaction_code = payment_response.get('transaction_code')
                payment.processed_at = timezone.now()
                payment.save()

                # Create or update subscription if payment is complete
                if payment.status == 'COMPLETE':
                    self._update_subscription(payment)

            # Redirect to appropriate success page based on payment source
            if payment.payment_source == 'order':
                success_redirect_url = f"{settings.FRONTEND_URL}/customer/orders/success?transaction_uuid={transaction_uuid}"
                return HttpResponseRedirect(success_redirect_url)
            else:
                # For payment page payments, redirect to payment success page
                success_redirect_url = f"{settings.FRONTEND_URL}/customer/payment/success?transaction_uuid={transaction_uuid}"
                return HttpResponseRedirect(success_redirect_url)

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
            
            logger.info(f"[PAYMENT_VERIFY] Verifying eSewa payment - Transaction: {transaction_uuid}, Amount: Rs.{amount}, Ref ID: {ref_id}")
            
            if not all([transaction_uuid, amount]):
                return JsonResponse({
                    'success': False, 
                    'error': 'Missing required eSewa parameters'
                })
            
            # Use atomic transaction with row locking
            with transaction.atomic():
                payment = Payment.objects.select_for_update().get(transaction_uuid=transaction_uuid)
                
                # Idempotency check: if already processed, return receipt
                if payment.status == 'COMPLETE' and payment.processed_at:
                    logger.info(f"Payment {transaction_uuid} already verified at {payment.processed_at}")
                    # Return full receipt with orders
                    process_view = ProcessPaymentView()
                    return process_view._get_payment_receipt(payment)
                
                # Verify the amount matches
                if float(amount) != float(payment.total_amount):
                    return JsonResponse({
                        'success': False, 
                        'error': 'Payment amount mismatch'
                    })
                
                # Update payment with eSewa transaction details
                logger.info(f"[PAYMENT_VERIFY] Updating payment with eSewa details - Ref ID: {ref_id}")
                payment.transaction_code = ref_id
                payment.ref_id = ref_id
                payment.save()
            
            # Process payment and distribute across orders
            logger.info(f"[PAYMENT_VERIFY] Initiating payment processing for {transaction_uuid}")
            process_view = ProcessPaymentView()
            return process_view.post(request, transaction_uuid)
            
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
        except DatabaseError as e:
            # Handle database locking errors
            error_msg = str(e).lower()
            if 'locked' in error_msg or 'database is locked' in error_msg:
                logger.warning(f"[PAYMENT_VERIFY] Database locked, payment may have been processed: {transaction_uuid}")
                
                # Try to fetch payment status without locking (read-only)
                try:
                    payment = Payment.objects.get(transaction_uuid=transaction_uuid)
                    if payment.status == 'COMPLETE' and payment.processed_at:
                        logger.info(f"[PAYMENT_VERIFY] Payment {transaction_uuid} was already processed successfully")
                        # Return success even though we hit a lock - payment is complete
                        process_view = ProcessPaymentView()
                        return process_view._get_payment_receipt(payment)
                except Payment.DoesNotExist:
                    pass
                
                return JsonResponse({
                    'success': False,
                    'error': 'Database is temporarily busy. Your payment may have been processed. Please check your order status.',
                    'retry_suggested': True
                }, status=503)
            else:
                logger.exception(f"[PAYMENT_VERIFY] Database error: {e}")
                return JsonResponse({
                    'success': False,
                    'error': f'Database error: {str(e)}'
                }, status=500)
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
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
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_history(request):
    """Get payment history for the authenticated user"""
    try:
        logger.info(f"[PAYMENT_HISTORY] Fetching history for user: {request.user} (ID: {request.user.id}, Email: {request.user.email})")
        
        # Get query parameters
        search = request.GET.get('search', '')
        payment_type = request.GET.get('payment_type', '')
        status = request.GET.get('status', '')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        
        # Build query
        payments = Payment.objects.filter(user=request.user).order_by('-created_at')
        logger.info(f"[PAYMENT_HISTORY] Found {payments.count()} payments for user {request.user.id} ({request.user.email})")

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
            # Get count of orders paid by this payment and total amount applied
            order_payments = OrderPayment.objects.filter(payment=payment)
            orders_count = order_payments.count()
            
            # Calculate total amount applied to orders
            amount_applied = order_payments.aggregate(
                total=models.Sum('amount_applied')
            )['total'] or 0
            
            # Calculate excess amount (overpayment not applied to any order)
            excess_amount = float(payment.total_amount) - float(amount_applied)
            
            # Determine if this is an advance payment (no orders at time of payment)
            is_advance_payment = orders_count == 0 and payment.status == 'COMPLETE'
            
            payments_data.append({
                'id': payment.id,
                'transaction_uuid': payment.transaction_uuid,
                'transaction_code': payment.transaction_code,
                'amount': float(payment.amount),
                'tax_amount': float(payment.tax_amount),
                'total_amount': float(payment.total_amount),
                'amount_applied': float(amount_applied),  # Amount actually applied to orders
                'excess_amount': float(excess_amount),  # Overpayment/unused amount
                'is_advance_payment': is_advance_payment,  # Indicates if this was an advance payment
                'payment_type': payment.payment_type,
                'payment_source': payment.payment_source,  # 'order' or 'payment_page'
                'branch_name': payment.branch.name if payment.branch else None,
                'branch_id': payment.branch.id if payment.branch else None,
                'orders_count': orders_count,  # Number of orders this payment was applied to
                'status': payment.status,
                'ref_id': payment.ref_id,
                'created_at': payment.created_at.isoformat(),
                'updated_at': payment.updated_at.isoformat(),
            })
        
        return Response({
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
        return Response({
            'success': False,
            'error': 'Failed to fetch payment history'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
