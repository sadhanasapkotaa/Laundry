from django.urls import path
from .views import (
    InitiatePaymentView,
    PaymentSuccessView,
    PaymentFailureView,
    CheckPaymentStatusView,
    user_subscription_status
)

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='initiate_payment'),  # ✅ fixed
    path('success/', PaymentSuccessView.as_view(), name='payment_success'),
    path('failure/', PaymentFailureView.as_view(), name='payment_failure'),
    path('status/<str:transaction_uuid>/', CheckPaymentStatusView.as_view(), name='check_payment_status'),
    path('subscription/status/', user_subscription_status, name='subscription_status'),
]
