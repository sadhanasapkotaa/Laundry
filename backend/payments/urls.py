from django.urls import path
from .views import (
    InitiatePaymentView,
    ProcessPaymentView,
    PaymentSuccessView,
    PaymentFailureView,
    CheckPaymentStatusView,
    VerifyEsewaPaymentView,
    user_subscription_status,
    payment_history
)

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='initiate_payment'),
    path('process/<str:transaction_uuid>/', ProcessPaymentView.as_view(), name='process_payment'),
    path('success/', PaymentSuccessView.as_view(), name='payment_success'),
    path('failure/', PaymentFailureView.as_view(), name='payment_failure'),
    path('verify-esewa/', VerifyEsewaPaymentView.as_view(), name='verify_esewa_payment'),
    path('status/<str:transaction_uuid>/', CheckPaymentStatusView.as_view(), name='check_payment_status'),
    path('subscription/status/', user_subscription_status, name='subscription_status'),
    path('history/', payment_history, name='payment_history'),
]
