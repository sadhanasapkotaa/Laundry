"""Models for the laundry service application, defining various service types,
wash methods, delivery options, and their associated costs."""
import uuid
from django.db import models


class SystemSettings(models.Model):
    """Singleton model for system-wide service costs (pickup, delivery, urgent)."""
    pickup_cost = models.DecimalField(max_digits=10, decimal_places=2, default=200.00)
    delivery_cost = models.DecimalField(max_digits=10, decimal_places=2, default=200.00)
    urgent_cost = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "System Settings"
        verbose_name_plural = "System Settings"

    def save(self, *args, **kwargs):
        """Ensure only one instance exists (singleton pattern)."""
        if not self.pk and SystemSettings.objects.exists():
            # Update the existing instance instead of creating a new one
            existing = SystemSettings.objects.first()
            self.pk = existing.pk
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance."""
        settings, _ = cls.objects.get_or_create(pk=1)
        return settings

    def __str__(self):
        return f"System Settings (Pickup: {self.pickup_cost}, Delivery: {self.delivery_cost}, Urgent: {self.urgent_cost})"


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
    """Defines different types of washing methods (e.g., Dry Wash, Machine Wash)."""
    name = models.CharField(max_length=100)  # e.g. Machine Wash, Dry Cleaning
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name}"


class ClothName(models.Model):
    """Defines different cloth names/categories (e.g., Saree, Suit, Shirt)."""
    name = models.CharField(max_length=100)  # e.g. Saree, Suit, Shirt, Pant
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class ClothType(models.Model):
    """Defines different cloth materials/types (e.g., Cotton, Siphon, Silk)."""
    name = models.CharField(max_length=100)  # e.g. Cotton, Siphon, Khaki, Silk
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class PricingRule(models.Model):
    """Pricing matrix: WashType × ClothName × ClothType = Price."""
    wash_type = models.ForeignKey(WashType, on_delete=models.CASCADE, related_name='pricing_rules')
    cloth_name = models.ForeignKey(ClothName, on_delete=models.CASCADE, related_name='pricing_rules')
    cloth_type = models.ForeignKey(ClothType, on_delete=models.CASCADE, related_name='pricing_rules')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('wash_type', 'cloth_name', 'cloth_type')
        verbose_name = "Pricing Rule"
        verbose_name_plural = "Pricing Rules"

    def __str__(self):
        return f"{self.wash_type.name} + {self.cloth_name.name} + {self.cloth_type.name} = Rs.{self.price}"


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

