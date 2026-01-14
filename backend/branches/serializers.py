"""Serializers for Branch and BranchManager models."""
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from users.models import Role
from .models import Branch, BranchManager

User = get_user_model()


class BranchSerializer(serializers.ModelSerializer):
    """Serializer for Branch model."""
    total_orders = serializers.ReadOnlyField(source='get_total_orders')
    monthly_revenue = serializers.ReadOnlyField(source='get_monthly_revenue')
    monthly_expenses = serializers.ReadOnlyField(source='get_monthly_expenses')
    staff_count = serializers.ReadOnlyField(source='get_staff_count')
    
    class Meta:
        """Meta class for Branch serializer."""
        model = Branch
        fields = [
            'id', 'name', 'branch_id', 'branch_manager', 'address', 'city',
            'map_link',
            'phone', 'email', 'status', 'opening_date', 'created', 'modified',
            'total_orders', 'monthly_revenue', 'monthly_expenses', 'staff_count'
        ]
        extra_kwargs = {
            'branch_id': {'read_only': True},  # Auto-generated, so read-only
        }

class BranchStatsSerializer(serializers.ModelSerializer):
    """Serializer for Branch statistics."""
    total_orders = serializers.ReadOnlyField(source='get_total_orders')
    monthly_revenue = serializers.ReadOnlyField(source='get_monthly_revenue')
    monthly_expenses = serializers.ReadOnlyField(source='get_monthly_expenses')
    staff_count = serializers.ReadOnlyField(source='get_staff_count')
    net_profit = serializers.SerializerMethodField()
    
    class Meta:
        """Meta class for Branch stats serializer."""
        model = Branch
        fields = [
            'id', 'name', 'branch_id', 'total_orders', 'monthly_revenue', 
            'monthly_expenses', 'staff_count', 'net_profit'
        ]
    
    def get_net_profit(self, obj):
        """Calculate net profit for the branch."""
        return obj.get_monthly_revenue() - obj.get_monthly_expenses()

class BranchManagerSerializer(serializers.ModelSerializer):
    """Serializer for BranchManager model."""
    id = serializers.ReadOnlyField(source='pk')
    user_email = serializers.ReadOnlyField(source='user.email')
    user_name = serializers.ReadOnlyField(source='user.get_full_name')
    user_phone = serializers.ReadOnlyField(source='user.phone')
    user_first_name = serializers.ReadOnlyField(source='user.first_name')
    user_last_name = serializers.ReadOnlyField(source='user.last_name')
    branch_name = serializers.ReadOnlyField(source='branch.name')
    
    # Fields for user creation (write-only, only required on create)
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    phone = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        """Meta class for BranchManager serializer."""
        model = BranchManager
        fields = [
            'id', 'user_email', 'user_name', 'user_phone', 'user_first_name', 'user_last_name',
            'manager_id', 'branch', 'branch_name',
            'salary', 'hired_date', 'leaving_date', 'id_type',
            'citizenship_number', 'is_active', 'created', 'modified',
            'email', 'password', 'first_name', 'last_name', 'phone'
        ]
        extra_kwargs = {
            'manager_id': {'read_only': True},
        }

    def validate(self, attrs):
        """Validate that required fields are present on create."""
        if self.instance is None:  # Create operation
            required_fields = ['email', 'password', 'first_name', 'last_name', 'phone']
            missing_fields = [field for field in required_fields if not attrs.get(field)]
            if missing_fields:
                raise serializers.ValidationError({
                    field: f"This field is required." for field in missing_fields
                })
        return attrs

    def create(self, validated_data):
        """Handle the creation of a BranchManager and its associated User."""
        user_data = {
            'email': validated_data.pop('email'),
            'password': validated_data.pop('password'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'phone': validated_data.pop('phone'),
        }
        
        # The rest of the validated_data is for the BranchManager
        branch_manager_data = validated_data

        with transaction.atomic():
            # Create the user
            user = User.objects.create_user(
                **user_data,
                role=Role.BRANCH_MANAGER,
                is_verified=True # Auto-verify for admin-created accounts
            )

            # Create the BranchManager, the save method will generate the manager_id
            branch_manager = BranchManager.objects.create(
                user=user, **branch_manager_data
            )
        
        return branch_manager

    def update(self, instance, validated_data):
        """Handle updating the BranchManager and its related User."""
        # instance is a BranchManager object
        user = instance.user

        # Update User fields from validated_data
        user.first_name = validated_data.get('first_name', user.first_name)
        user.last_name = validated_data.get('last_name', user.last_name)
        user.save()

        # Update BranchManager fields
        instance.branch = validated_data.get('branch', instance.branch)
        instance.salary = validated_data.get('salary', instance.salary)
        instance.hired_date = validated_data.get('hired_date', instance.hired_date)
        instance.leaving_date = validated_data.get('leaving_date', instance.leaving_date)
        instance.id_type = validated_data.get('id_type', instance.id_type)
        instance.citizenship_number = validated_data.get('citizenship_number', instance.citizenship_number)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        
        instance.save()

        return instance
