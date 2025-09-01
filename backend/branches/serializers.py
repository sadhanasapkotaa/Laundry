"""Serializers for Branch and BranchManager models."""
from rest_framework import serializers
from .models import Branch, BranchManager

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
    user_email = serializers.ReadOnlyField(source='user.email')
    user_name = serializers.ReadOnlyField(source='user.get_full_name')
    branch_name = serializers.ReadOnlyField(source='branch.name')
    
    # Fields for user creation (write-only)
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    phone = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        """Meta class for BranchManager serializer."""
        model = BranchManager
        fields = [
            'id', 'manager_id', 'user', 'user_email', 'user_name', 'branch', 'branch_name',
            'salary', 'hired_date', 'leaving_date', 'id_type',
            'citizenship_number', 'is_active', 'created', 'modified',
            # User creation fields
            'email', 'password', 'first_name', 'last_name', 'phone'
        ]
        extra_kwargs = {
            'user': {'read_only': True},  # User will be set in the view
        }
