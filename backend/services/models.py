"""Models for the laundry service application, defining various service types,
wash methods, delivery options, and their associated costs."""
import uuid
from django.db import models

class Service(models.Model):
    """Laundry service options like individual, bulk or hybrid."""
    SERVICE_TYPE_CHOICES = [
        ('individual', 'Individual Clothes'),
        ('bulk', 'Bulk (kg)'),
        ('hybrid', 'Hybrid'),
    ]

    id = models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)
    name = models.CharField(max_length=100)  # e.g. Premium, Express
    service_type = models.CharField(max_length=10, choices=SERVICE_TYPE_CHOICES)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.service_type}"


class WashType(models.Model):
    """Defines different types of washing methods."""
    name = models.CharField(max_length=100)  # e.g. Machine Wash, Dry Cleaning
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name}"


class DeliveryType(models.Model):
    """Different levels of service handling (e.g. Pickup + Delivery, etc.)."""
    name = models.CharField(max_length=100)  # e.g. Wash Only, Wash + Iron + Deliver
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name}"


class ServiceCost(models.Model):
    """
    Connects Service + WashType + DeliveryType combinations with pricing.
    This defines fixed cost structures.
    """
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    wash_type = models.ForeignKey(WashType, on_delete=models.CASCADE)
    delivery_type = models.ForeignKey(DeliveryType, on_delete=models.CASCADE)
    base_cost = models.DecimalField(max_digits=10, decimal_places=2)  # Cost per unit (kg/piece)

    class Meta:
        """Meta class for ServiceCost."""
        unique_together = ('service', 'wash_type', 'delivery_type')

    def __str__(self):
        return f"{self.service.name}"


class IndividualCloth(models.Model):
    """For per-piece laundry items."""
    service = models.ForeignKey(Service,
                                related_name='individual_clothes', on_delete=models.CASCADE)
    cloth_description = models.CharField(max_length=100)  # e.g. Saree, Tuxedo
    price_per_piece = models.DecimalField(max_digits=7, decimal_places=2)

    def __str__(self):
        return f"{self.cloth_description} - {self.price_per_piece} per piece"


class BulkCloth(models.Model):
    """For laundry items charged by weight."""
    service = models.ForeignKey(Service, related_name='bulk_clothes', on_delete=models.CASCADE)
    cloth_type = models.CharField(max_length=100)  # e.g. Quilts, Mixed Clothes
    price_per_kg = models.DecimalField(max_digits=7, decimal_places=2)

    def __str__(self):
        return f"{self.cloth_type} - {self.price_per_kg} per kg"
