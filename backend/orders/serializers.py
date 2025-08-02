"""Serializers for the orders application, defining how Order and Delivery 
models are serialized for API responses."""
from rest_framework import serializers
from .models import Order, Delivery

class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model."""
    class Meta:
        """Meta class for OrderSerializer."""
        model = Order
        fields = '__all__'


class DeliverySerializer(serializers.ModelSerializer):
    """Serializer for Delivery model."""
    class Meta:
        """Meta class for DeliverySerializer."""
        model = Delivery
        fields = '__all__'
