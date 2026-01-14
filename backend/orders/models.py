"""Models for the orders app in a laundry management system."""
import uuid
from django.db import models

# Create your models here.
class Order(models.Model):
    """Model representing an order placed by a customer for laundry services."""
    # order_id = models.AutoField(primary_key=True)
    order_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer_name = models.ForeignKey('users.User', on_delete=models.CASCADE)
    branch = models.ForeignKey('branches.Branch', on_delete=models.CASCADE)
    pickup_requested = models.BooleanField(default=False)
    order_date = models.DateTimeField(auto_now_add=True)
    pickup_enabled = models.BooleanField(default=False)
    delivery_enabled = models.BooleanField(default=False)
    pickup_date = models.DateTimeField(blank=True, null=True)
    pickup_time = models.CharField(max_length=20, choices=[
        ('early_morning', 'Early Morning (6am - 9am)'),
        ('late_morning', 'Late Morning (9am - 12pm)'),
        ('early_afternoon', 'Early Afternoon (12pm - 3pm)'),
        ('late_afternoon', 'Late Afternoon (3pm - 6pm)'),
    ], blank=True, null=True)
    
    delivery_date = models.DateTimeField(blank=True, null=True)
    delivery_time = models.CharField(max_length=20, choices=[
        ('early_morning', 'Early Morning (6am - 9am)'),
        ('late_morning', 'Late Morning (9am - 12pm)'),
        ('early_afternoon', 'Early Afternoon (12pm - 3pm)'),
        ('late_afternoon', 'Late Afternoon (3pm - 6pm)'),
    ], blank=True, null=True)
    status = models.CharField(max_length=20, choices=[
        ('dropped by user', 'Dropped by User'),
        ('pending pickup', 'Pending Pickup'),
        ('picked up', 'Picked Up'),
        ('sent to wash', 'Sent to Wash'),
        ('in wash', 'In Wash'),
        ('washed', 'Washed'),
        ('picked by client', 'Picked by Client'),
        ('pending delivery', 'Pending Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded')
    ], default='dropped by user')
    description = models.TextField(blank=True, null=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_urgent = models.BooleanField(default=False)
    payment_method = models.CharField(max_length=20, choices=[
        ('esewa', 'eSewa'),
        ('bank', 'Bank Transfer'),
        ('cash', 'Cash on Delivery')
    ], default='cash')
    payment_status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
        ('failed', 'Failed')
    ], default='pending')

    def __str__(self):
        return f"Order {self.order_id} by {self.customer_name} - Total: {self.total_amount}"


class OrderItem(models.Model):
    """Model representing individual items within an order."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items')
    service_type = models.CharField(max_length=100)  # e.g., 'saree', 'shirt', 'pant'
    wash_type = models.CharField(max_length=100, blank=True, null=True)  # e.g., 'Dry Wash', 'Normal Wash'
    material = models.CharField(max_length=100)  # e.g., 'cotton', 'silk', 'wool'
    quantity = models.PositiveIntegerField()
    pricing_type = models.CharField(max_length=20, choices=[
        ('individual', 'Individual'),
        ('bulk', 'Bulk')
    ], default='individual')
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        wash_info = f" - {self.wash_type}" if self.wash_type else ""
        return f"{self.service_type}{wash_info} ({self.material}) x{self.quantity} - {self.total_price}"


class Delivery(models.Model):
    """Model representing a delivery associated with an order."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='deliveries')
    delivery_address = models.CharField(max_length=255)
    map_link = models.URLField(blank=True, null=True)
    delivery_contact = models.CharField(max_length=15,
                                        default=models.ForeignKey('users.User',
                                                                  on_delete=models.CASCADE))
    delivery_type = models.CharField(max_length=7, choices=[
        ('pickup', 'Pickup'),
        ('drop', 'Drop')
    ], default='pickup')
    delivery_person = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    delivery_date = models.DateTimeField(auto_now_add=True)
    delivery_vehicle = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled')
    ], default='pending')
    delivery_start_time = models.DateTimeField(blank=True, null=True)
    delivery_end_time = models.DateTimeField(blank=True, null=True)
    TIME_SLOTS = [
        ('early_morning', 'Early Morning (6am - 9am)'),
        ('late_morning', 'Late Morning (9am - 12pm)'),
        ('early_afternoon', 'Early Afternoon (12pm - 3pm)'),
        ('late_afternoon', 'Late Afternoon (3pm - 6pm)'),
    ]

    delivery_time = models.CharField(max_length=20, choices=TIME_SLOTS, default='late_afternoon')

    def __str__(self):
        return f"({self.delivery_type} - Status: {self.status})"


class UserAddress(models.Model):
    """Model to store user addresses for pickup and delivery."""
    ADDRESS_TYPES = (
        ('pickup', 'Pickup'),
        ('delivery', 'Delivery'),
        ('both', 'Both'),
    )

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='addresses')
    address = models.CharField(max_length=255)
    map_link = models.URLField(blank=True, null=True)
    address_type = models.CharField(max_length=10, choices=ADDRESS_TYPES, default='both')
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email} - {self.address} ({self.address_type})"


class OrderPayment(models.Model):
    """Model to track which payments pay which orders (junction table)."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_payments')
    payment = models.ForeignKey('payments.Payment', on_delete=models.CASCADE, related_name='order_payments')
    amount_applied = models.DecimalField(max_digits=10, decimal_places=2, 
                                         help_text="Portion of payment applied to this order")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order', 'payment']),
            models.Index(fields=['payment']),
        ]
    
    def __str__(self):
        return f"Payment {self.payment.transaction_uuid} -> Order {self.order.order_id}: Rs.{self.amount_applied}"

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Sum
from django.utils import timezone

@receiver(post_save, sender=Order)
def check_vip_status(sender, instance, created, **kwargs):
    """
    Check if user qualifies for VIP status after an order is updated.
    VIP Status Condition: Total spend > 50,000 in the current month.
    """
    # Only check if order is completed/delivered/paid to avoid counting cancelled/pending orders prematurely
    # Adjust status check based on business logic. 'delivered' seems appropriate for realized revenue.
    if instance.status in ['delivered', 'completed', 'paid']: 
        user = instance.customer_name
        
        # Current month range
        now = timezone.now()
        
        # Calculate total spend for the user in the current month
        # We filter by Delivered/Paid orders to ensure valid spend
        monthly_spend = Order.objects.filter(
            customer_name=user,
            status__in=['delivered', 'completed', 'paid'], # Ensure we match the status check above
            order_date__month=now.month,
            order_date__year=now.year
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Check threshold
        if monthly_spend > 50000:
            if not user.is_vip:
                user.is_vip = True
                user.save()
                print(f"User {user.email} promoted to VIP status! Monthly spend: {monthly_spend}")

