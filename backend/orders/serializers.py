"""Serializers for the orders application, defining how Order and Delivery
models are serialized for API responses."""
from rest_framework import serializers
from .models import Order, Delivery, OrderItem
from django.contrib.auth import get_user_model

User = get_user_model()

class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for OrderItem model."""
    class Meta:
        model = OrderItem
        fields = ['service_type', 'material', 'quantity', 'pricing_type', 'price_per_unit', 'total_price']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model."""
    order_items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.StringRelatedField(read_only=True)
    branch = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_id', 'customer_name', 'branch', 'pickup_requested', 'order_date',
            'pickup_enabled', 'delivery_enabled', 'delivery_date', 'status',
            'description', 'total_amount', 'is_urgent', 'payment_method', 'payment_status',
            'order_items'
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders with nested order items."""
    services = OrderItemSerializer(many=True, write_only=True)
    customer = serializers.IntegerField(write_only=True)  # Changed from 'user' to 'customer' and UUIDField to IntegerField
    branch = serializers.IntegerField(write_only=True)
    pickup_date = serializers.DateField(required=False, allow_null=True)
    pickup_time = serializers.CharField(required=False, allow_blank=True)  # Changed to CharField to handle time slots
    pickup_address = serializers.CharField(required=False, allow_blank=True)
    pickup_map_link = serializers.URLField(required=False, allow_blank=True)
    delivery_date = serializers.DateField(required=False, allow_null=True)
    delivery_time = serializers.CharField(required=False, allow_blank=True)  # Changed to CharField to handle time slots
    delivery_address = serializers.CharField(required=False, allow_blank=True)
    delivery_map_link = serializers.URLField(required=False, allow_blank=True)
    status = serializers.CharField(default='pending')

    class Meta:
        model = Order
        fields = [
            'customer', 'branch', 'services', 'pickup_enabled', 'delivery_enabled',
            'pickup_date', 'pickup_time', 'pickup_address', 'pickup_map_link',
            'delivery_date', 'delivery_time', 'delivery_address', 'delivery_map_link',
            'is_urgent', 'total_amount', 'payment_method', 'payment_status', 'description', 'status'
        ]

    def create(self, validated_data):
        services_data = validated_data.pop('services')
        customer_id = validated_data.pop('customer')  # Changed from 'user' to 'customer'
        branch_id = validated_data.pop('branch')

        # Get user and branch instances
        try:
            user = User.objects.get(id=customer_id)
            from branches.models import Branch
            branch = Branch.objects.get(id=branch_id)
        except (User.DoesNotExist, Branch.DoesNotExist) as e:
            raise serializers.ValidationError(f"Invalid user or branch: {str(e)}")

        # Create the order
        order = Order.objects.create(
            customer_name=user,
            branch=branch,
            **validated_data
        )

        # Create order items
        for service_data in services_data:
            OrderItem.objects.create(order=order, **service_data)

        return order


class DeliverySerializer(serializers.ModelSerializer):
    """Serializer for Delivery model."""
    class Meta:
        model = Delivery
        fields = '__all__'
