"""This module defines the Payment and Subscription models for handling payment
transactions and user subscriptions in the backend."""
# payments/models.py
import uuid
from datetime import datetime
from django.db import models
# from django.contrib.auth.models import User
from django.conf import settings


class Payment(models.Model):
    """Model representing a payment transaction."""
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETE', 'Complete'),
        ('FAILED', 'Failed'),
        ('CANCELED', 'Canceled'),
        ('FULL_REFUND', 'Full Refund'),
        ('PARTIAL_REFUND', 'Partial Refund'),
        ('NOT_FOUND', 'Not Found'),
    ]
    PAYMENT_TYPE_CHOICES = [
        ('cash', 'Cash'),
        ('bank', 'Bank'),
        ('esewa', 'Esewa'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    transaction_uuid = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=5000.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=5000.00)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    payment_type = models.CharField(max_length=10, choices=PAYMENT_TYPE_CHOICES, default='cash')
    transaction_code = models.CharField(max_length=50, blank=True, null=True)
    ref_id = models.CharField(max_length=50, blank=True, null=True)
    order_data = models.JSONField(blank=True, null=True, help_text="Order data to create order after payment")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.transaction_uuid} - Rs.{self.total_amount}"

    def save(self, *args, **kwargs):
        if not self.transaction_uuid:
            # Generate unique transaction UUID
            timestamp = datetime.now().strftime("%y%m%d-%H%M%S")
            self.transaction_uuid = f"{timestamp}-{str(uuid.uuid4())[:8]}"
        super().save(*args, **kwargs)

class Subscription(models.Model):
    """Model representing a user's subscription."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=False)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Subscription - Active: {self.is_active}"
