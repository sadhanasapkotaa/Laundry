"""Serializers for the orders application, defining how Order and Delivery
models are serialized for API responses."""
from rest_framework import serializers
from .models import Order, Delivery, OrderItem, UserAddress
from django.contrib.auth import get_user_model
from datetime import datetime

User = get_user_model()

class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for OrderItem model."""
    class Meta:
        model = OrderItem
        fields = ['service_type', 'material', 'quantity', 'pricing_type', 'price_per_unit', 'total_price']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model."""
    services = OrderItemSerializer(source='order_items', many=True, read_only=True)
    customer_name = serializers.StringRelatedField(read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    id = serializers.UUIDField(source='order_id', read_only=True)
    created = serializers.DateTimeField(source='order_date', read_only=True)

    pickup_date = serializers.SerializerMethodField()
    pickup_time = serializers.SerializerMethodField()
    pickup_address = serializers.SerializerMethodField()
    pickup_map_link = serializers.SerializerMethodField()
    delivery_time = serializers.SerializerMethodField()
    delivery_address = serializers.SerializerMethodField()
    delivery_map_link = serializers.SerializerMethodField()
    delivery_contact = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'customer_name', 'branch', 'branch_name', 'pickup_requested', 
            'order_date', 'created', 'pickup_enabled', 'delivery_enabled', 'delivery_date', 
            'status', 'description', 'total_amount', 'is_urgent', 'payment_method', 
            'payment_status', 'services',
            'pickup_date', 'pickup_time', 'pickup_address', 'pickup_map_link',
            'delivery_time', 'delivery_address', 'delivery_map_link', 'delivery_contact'
        ]

    def get_pickup_delivery(self, obj, delivery_type):
        return obj.deliveries.filter(delivery_type=delivery_type).first()

    def get_pickup_date(self, obj):
        delivery = self.get_pickup_delivery(obj, 'pickup')
        if delivery and delivery.delivery_start_time:
            return delivery.delivery_start_time.date()
        return None

    def get_pickup_time(self, obj):
        delivery = self.get_pickup_delivery(obj, 'pickup')
        if delivery and delivery.delivery_start_time:
            return delivery.delivery_start_time.time()
        return None

    def get_pickup_address(self, obj):
        delivery = self.get_pickup_delivery(obj, 'pickup')
        return delivery.delivery_address if delivery else None

    def get_pickup_map_link(self, obj):
        """Get the map link for pickup address."""
        delivery = self.get_pickup_delivery(obj, 'pickup')
        if delivery:
            # Try to find map link from UserAddress if address matches
            from orders.models import UserAddress
            user_address = UserAddress.objects.filter(
                user=obj.customer_name,
                address=delivery.delivery_address
            ).first()
            if user_address and user_address.map_link:
                return user_address.map_link
        return None

    def get_delivery_time(self, obj):
        delivery = self.get_pickup_delivery(obj, 'drop')
        if delivery and delivery.delivery_start_time:
            return delivery.delivery_start_time.time()
        return None

    def get_delivery_address(self, obj):
        delivery = self.get_pickup_delivery(obj, 'drop')
        return delivery.delivery_address if delivery else None

    def get_delivery_map_link(self, obj):
        """Get the map link for delivery address."""
        delivery = self.get_pickup_delivery(obj, 'drop')
        if delivery:
            # Try to find map link from UserAddress if address matches
            from orders.models import UserAddress
            user_address = UserAddress.objects.filter(
                user=obj.customer_name,
                address=delivery.delivery_address
            ).first()
            if user_address and user_address.map_link:
                return user_address.map_link
        return None

    def get_delivery_contact(self, obj):
        """Get the delivery contact from the delivery object."""
        delivery = self.get_pickup_delivery(obj, 'drop')
        if delivery:
            return delivery.delivery_contact
        # Fallback to pickup delivery contact
        pickup = self.get_pickup_delivery(obj, 'pickup')
        if pickup:
            return pickup.delivery_contact
        return None


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders with nested order items."""
    services = OrderItemSerializer(many=True, write_only=True)
    branch = serializers.IntegerField(write_only=True)
    pickup_date = serializers.DateField(required=False, allow_null=True)
    pickup_time = serializers.TimeField(required=False, allow_null=True)
    pickup_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    pickup_map_link = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    delivery_date = serializers.DateField(required=False, allow_null=True)
    delivery_time = serializers.TimeField(required=False, allow_null=True)
    delivery_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    delivery_map_link = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    # Return fields for response
    id = serializers.UUIDField(source='order_id', read_only=True)
    order_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'branch', 'services', 'pickup_enabled', 'delivery_enabled',
            'pickup_date', 'pickup_time', 'pickup_address', 'pickup_map_link',
            'delivery_date', 'delivery_time', 'delivery_address', 'delivery_map_link',
            'is_urgent', 'total_amount', 'payment_method', 'payment_status', 'description'
        ]

    def create(self, validated_data):
        services_data = validated_data.pop('services')
        branch_id = validated_data.pop('branch')

        # Extract pickup/delivery details from request
        pickup_date = validated_data.pop('pickup_date', None)
        pickup_time = validated_data.pop('pickup_time', None)
        pickup_address = validated_data.pop('pickup_address', None)
        pickup_map_link = validated_data.pop('pickup_map_link', None)
        
        delivery_date = validated_data.pop('delivery_date', None) 
        delivery_time = validated_data.pop('delivery_time', None)
        delivery_address = validated_data.pop('delivery_address', None)
        delivery_map_link = validated_data.pop('delivery_map_link', None)
        
        # Get user from request context (authenticated user)
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required to create an order")
        
        user = request.user

        # Resolve Pickup Address
        if not pickup_address:
            # Try to get default pickup address from user profile
            # Try to get default pickup address from user profile
            from orders.models import UserAddress
            user_address = UserAddress.objects.filter(
                user=user, 
                address_type__in=['pickup', 'both']
            ).order_by('-is_default').first()
            
            if user_address:
                pickup_address = user_address.address
                if not pickup_map_link:
                    pickup_map_link = user_address.map_link

        # Resolve Delivery Address
        if not delivery_address:
            # Try to get default delivery address from user profile
            # Try to get default delivery address from user profile
            from orders.models import UserAddress
            user_address = UserAddress.objects.filter(
                user=user, 
                address_type__in=['delivery', 'both']
            ).order_by('-is_default').first()
            
            if user_address:
                delivery_address = user_address.address
                if not delivery_map_link:
                    delivery_map_link = user_address.map_link

        # Get branch instance
        try:
            from branches.models import Branch
            branch = Branch.objects.get(id=branch_id)
        except Branch.DoesNotExist:
            raise serializers.ValidationError(f"Branch with id {branch_id} does not exist")

        # Calculate delivery datetime for Order model
        order_delivery_date = None
        if delivery_date:
            if delivery_time:
                 order_delivery_date = datetime.combine(delivery_date, delivery_time)
            else:
                 order_delivery_date = datetime.combine(delivery_date, datetime.min.time())

        # Create the order
        order = Order.objects.create(
            customer_name=user,
            branch=branch,
            delivery_date=order_delivery_date,
            **validated_data
        )

        # Create order items
        for service_data in services_data:
            OrderItem.objects.create(order=order, **service_data)

        # Create Delivery objects (Snapshot of address)
        if order.pickup_enabled:
            Delivery.objects.create(
                order=order,
                delivery_address=pickup_address or "No address provided",
                delivery_contact=user.phone or "",  # Handle None phone
                delivery_type='pickup',
                status='pending',
                delivery_start_time=datetime.combine(pickup_date, pickup_time) if pickup_date and pickup_time else None,
            )
            
        if order.delivery_enabled:
            Delivery.objects.create(
                order=order,
                delivery_address=delivery_address or "No address provided",
                delivery_contact=user.phone or "",  # Handle None phone
                delivery_type='drop',
                status='pending',
                delivery_start_time=datetime.combine(delivery_date, delivery_time) if delivery_date and delivery_time else None,
            )

        return order


class DeliverySerializer(serializers.ModelSerializer):
    """Serializer for Delivery model."""
    class Meta:
        model = Delivery
        fields = '__all__'


class UserAddressSerializer(serializers.ModelSerializer):
    """Serializer for UserAddress model."""
    class Meta:
        model = UserAddress
        fields = ['id', 'address', 'map_link', 'address_type', 'is_default']
        read_only_fields = ['id']

    def create(self, validated_data):
        """Create a new user address."""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)
