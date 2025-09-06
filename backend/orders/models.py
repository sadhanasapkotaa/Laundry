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
    pickup_date = models.DateField(blank=True, null=True)
    pickup_time = models.CharField(max_length=50, blank=True, null=True)  # Changed from TimeField to CharField
    pickup_address = models.TextField(blank=True, null=True)
    pickup_map_link = models.URLField(blank=True, null=True)
    delivery_date = models.DateField(blank=True, null=True)
    delivery_time = models.CharField(max_length=50, blank=True, null=True)  # Changed from TimeField to CharField
    delivery_address = models.TextField(blank=True, null=True)
    delivery_map_link = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('ready', 'Ready'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled')
    ], default='pending')
    description = models.TextField(blank=True, null=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_urgent = models.BooleanField(default=False)
    payment_method = models.CharField(max_length=20, choices=[
        ('esewa', 'eSewa'),
        ('bank', 'Bank Transfer'),
        ('cash', 'Cash on Delivery')
    ], default='cash')
    payment_status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('unpaid', 'Unpaid'),
        ('failed', 'Failed')
    ], default='pending')

    def __str__(self):
        return f"Order {self.order_id} by {self.customer_name} - Total: {self.total_amount}"


class OrderItem(models.Model):
    """Model representing individual items within an order."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items')
    service_type = models.CharField(max_length=100)  # e.g., 'saree', 'shirt', 'pant'
    material = models.CharField(max_length=100)  # e.g., 'cotton', 'silk', 'wool'
    quantity = models.PositiveIntegerField()
    pricing_type = models.CharField(max_length=20, choices=[
        ('individual', 'Individual'),
        ('bulk', 'Bulk')
    ], default='individual')
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.service_type} ({self.material}) x{self.quantity} - {self.total_price}"


class Delivery(models.Model):
    """Model representing a delivery associated with an order."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='deliveries')
    delivery_address = models.CharField(max_length=255)
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
    delivery_time = models.CharField(max_length=20, choices=[
        ('morning', 'Morning'),
        ('afternoon', 'Afternoon'),
        ('evening', 'Evening'),
    ], default='evening')

    def __str__(self):
        return f"({self.delivery_type} - Status: {self.status})"
