from django.urls import path
from .views import (
    InitiatePaymentView,
    ProcessPaymentView,
    PaymentSuccessView,
    PaymentFailureView,
    CheckPaymentStatusView,
    VerifyEsewaPaymentView,
    user_subscription_status,
    payment_history,
    verify_bank_payment,
    pending_bank_payments
)

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='initiate_payment'),
    path('process/<str:transaction_uuid>/', ProcessPaymentView.as_view(), name='process_payment'),
    path('success/', PaymentSuccessView.as_view(), name='payment_success'),
    path('failure/', PaymentFailureView.as_view(), name='payment_failure'),
    path('verify-esewa/', VerifyEsewaPaymentView.as_view(), name='verify_esewa_payment'),
    path('verify-bank/<str:transaction_uuid>/', verify_bank_payment, name='verify_bank_payment'),
    path('pending-bank/', pending_bank_payments, name='pending_bank_payments'),
    path('status/<str:transaction_uuid>/', CheckPaymentStatusView.as_view(), name='check_payment_status'),
    path('subscription/status/', user_subscription_status, name='subscription_status'),
    path('history/', payment_history, name='payment_history'),
]
