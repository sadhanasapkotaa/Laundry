"""This code is part of a Django REST Framework application that 
defines serializers for various models related to laundry services. 
Each serializer is responsible for converting model instances into 
JSON format and validating incoming data."""
# serializers.py
from rest_framework import serializers
from .models import (
    Service, WashType, DeliveryType, ServiceCost, IndividualCloth, BulkCloth,
    SystemSettings, ClothName, ClothType, PricingRule
)


class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializer for the SystemSettings model (singleton)."""
    class Meta:
        model = SystemSettings
        fields = ['id', 'pickup_cost', 'delivery_cost', 'urgent_cost', 'updated_at']
        read_only_fields = ['id', 'updated_at']


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
        fields = ['id', 'name', 'description', 'is_active']


class ClothNameSerializer(serializers.ModelSerializer):
    """Serializer for the ClothName model."""
    class Meta:
        model = ClothName
        fields = ['id', 'name', 'description', 'is_active']


class ClothTypeSerializer(serializers.ModelSerializer):
    """Serializer for the ClothType model."""
    class Meta:
        model = ClothType
        fields = ['id', 'name', 'description', 'is_active']


class PricingRuleSerializer(serializers.ModelSerializer):
    """Serializer for the PricingRule model."""
    wash_type_name = serializers.CharField(source='wash_type.name', read_only=True)
    cloth_name_name = serializers.CharField(source='cloth_name.name', read_only=True)
    cloth_type_name = serializers.CharField(source='cloth_type.name', read_only=True)

    class Meta:
        model = PricingRule
        fields = [
            'id', 'wash_type', 'cloth_name', 'cloth_type', 'price', 'is_active',
            'wash_type_name', 'cloth_name_name', 'cloth_type_name'
        ]


class PricingLookupSerializer(serializers.Serializer):
    """Serializer for looking up a price by wash_type, cloth_name, cloth_type."""
    wash_type = serializers.IntegerField()
    cloth_name = serializers.IntegerField()
    cloth_type = serializers.IntegerField()


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

