"""Signals for the payments app to handle automatic income creation."""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Payment
from accounting.models import Income, IncomeCategory
from orders.models import OrderPayment

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Payment)
def create_income_from_payment(sender, instance, created, **kwargs):
    """
    Create income records when a payment is marked as complete.
    This ensures that branch income is properly tracked when payments are RECEIVED.
    
    Income Creation Logic:
    - Only creates income when payment status is 'COMPLETE' and processed_at is set
    - This ensures income is only recorded when transactions are actually received:
      * Cash payments: Income recorded immediately (cash is received on delivery)
      * eSewa payments: Income recorded when verified via eSewa (payment received)
      * Bank payments: Income recorded when staff verifies bank transfer (payment received)
    
    - Amount recorded equals the total amount applied to orders (or full payment amount for advance payments)
    - Income is linked back to the payment via income_record field to prevent duplicates
    - Requires payment to have an associated branch for income tracking
    """
    # Only process when payment status changes to COMPLETE and hasn't been processed before
    if instance.status == 'COMPLETE' and instance.processed_at:
        try:
            # Check if income record already exists for this payment
            if instance.income_record is not None:
                logger.info(f"Income record already exists for payment {instance.transaction_uuid}")
                return
            
            # Get or create income category for payments
            category, _ = IncomeCategory.objects.get_or_create(
                name='Payment Income',
                defaults={'name': 'Payment Income'}
            )
            
            # Calculate the amount to record as income
            # This should be the total amount of the payment that was applied to orders
            order_payments = OrderPayment.objects.filter(payment=instance)
            total_applied = sum(op.amount_applied for op in order_payments)
            
            # If no order payments exist, this is an advance payment
            if not order_payments.exists():
                total_applied = instance.total_amount
            
            # Create income record if there's an amount to record and a branch
            if total_applied > 0 and instance.branch:
                income = Income.objects.create(
                    branch=instance.branch,
                    category=category,
                    amount=total_applied,
                    description=f"Income from payment {instance.transaction_uuid}",
                    date_received=timezone.now().date()
                )
                
                # Link the income record to the payment for future reference
                instance.income_record = income
                instance.save(update_fields=['income_record'])
                
                logger.info(f"Created income record {income.id} for payment {instance.transaction_uuid}")
            else:
                logger.info(f"No income recorded for payment {instance.transaction_uuid} - Amount: {total_applied}, Branch: {instance.branch}")
                
        except Exception as e:
            logger.error(f"Error creating income from payment {instance.transaction_uuid}: {str(e)}")