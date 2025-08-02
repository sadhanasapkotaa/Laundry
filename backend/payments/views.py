# payments/views.py
"""Module docstring"""
import json
import base64
import logging
from datetime import datetime, timedelta
import requests
from django.db import DatabaseError
from rest_framework.permissions import IsAuthenticated
# from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
# from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views import View
from django.core.exceptions import ValidationError 
from .models import Payment, Subscription
from .utils import EsewaPaymentUtils
# import ValidationError

logger = logging.getLogger(__name__)



@method_decorator([csrf_exempt, login_required], name='dispatch')
class InitiatePaymentView(View):
    """Initiate payment process with eSewa"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Handle payment initiation"""
        try:
            payment = Payment.objects.create(
                user=request.user,
                amount=5000.00,
                tax_amount=0.00,
                total_amount=5000.00,
                status='PENDING'
            )

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
                'success_url': f"{settings.FRONTEND_URL}/payment/success",
                'failure_url': f"{settings.FRONTEND_URL}/payment/failure",
                'signed_field_names': 'total_amount,transaction_uuid,product_code',
                'signature': signature
            }

            return JsonResponse({
                'success': True,
                'payment_data': payment_data,
                'esewa_url': settings.ESEWA_PAYMENT_URL,
                'transaction_uuid': payment.transaction_uuid
            })

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
                                 'error': 'An unexpected error occurred'}, status=500)

class PaymentSuccessView(View):
    """Handle successful payment response from eSewa"""
    def get(self, request):
        """Process successful payment"""
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

            # Find and update payment
            transaction_uuid = payment_response.get('transaction_uuid')
            #pylint: disable=no-member
            payment = Payment.objects.get(transaction_uuid=transaction_uuid)

            payment.status = payment_response.get('status', 'COMPLETE')
            payment.transaction_code = payment_response.get('transaction_code')
            payment.save()

            # Create or update subscription if payment is complete
            if payment.status == 'COMPLETE':
                # pylint: disable=no-member
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

            return JsonResponse({
                'success': True,
                'payment': {
                    'transaction_uuid': payment.transaction_uuid,
                    'transaction_code': payment.transaction_code,
                    'status': payment.status,
                    'amount': float(payment.total_amount)
                }
            })

        except Payment.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Payment not found'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

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