"""This code is part of a Django REST Framework application that 
defines serializers for various models related to laundry services. 
Each serializer is responsible for converting model instances into 
JSON format and validating incoming data."""
# serializers.py
from rest_framework import serializers
from .models import Service, WashType, DeliveryType, ServiceCost, IndividualCloth, BulkCloth

class ServiceSerializer(serializers.ModelSerializer):
    """Serializer for the Service model."""
    class Meta:
        """Meta class to define model and fields."""
        model = Service
        fields = '__all__'

class WashTypeSerializer(serializers.ModelSerializer):
    """Serializer for the WashType model."""
    class Meta:
        """Meta class to define model and fields."""
        model = WashType
        fields = '__all__'

class DeliveryTypeSerializer(serializers.ModelSerializer):
    """Serializer for the DeliveryType model."""
    class Meta:
        """Meta class to define model and fields."""
        model = DeliveryType
        fields = '__all__'

class ServiceCostSerializer(serializers.ModelSerializer):
    """Serializer for the ServiceCost model."""
    class Meta:
        """Meta class to define model and fields."""
        model = ServiceCost
        fields = '__all__'

class IndividualClothSerializer(serializers.ModelSerializer):
    """Serializer for the IndividualCloth model."""
    class Meta:
        """Meta class to define model and fields."""
        model = IndividualCloth
        fields = '__all__'

class BulkClothSerializer(serializers.ModelSerializer):
    """Serializer for the BulkCloth model."""
    class Meta:
        """Meta class to define model and fields."""
        model = BulkCloth
        fields = '__all__'
