"""Serializers for payment-related models and operations."""
from rest_framework import serializers
from decimal import Decimal
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model."""
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'transaction_uuid', 'amount', 'tax_amount', 'total_amount',
            'status', 'payment_type', 'transaction_code', 'ref_id', 'branch',
            'branch_name', 'user_email', 'created_at', 'updated_at', 'processed_at'
        ]
        read_only_fields = [
            'id', 'transaction_uuid', 'created_at', 'updated_at', 'processed_at'
        ]


class PaymentInitiateSerializer(serializers.Serializer):
    """Serializer for payment initiation with validation."""
    payment_type = serializers.ChoiceField(
        choices=['esewa', 'cash', 'bank'],
        default='esewa'
    )
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
        error_messages={
            'min_value': 'Amount must be greater than zero.',
            'invalid': 'Please enter a valid amount.'
        }
    )
    branch_id = serializers.IntegerField(required=True)
    idempotency_key = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )
    payment_source = serializers.ChoiceField(
        choices=['order', 'payment_page'],
        required=False,
        allow_blank=True,
        default='payment_page'
    )
    order_data = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text="Order details to create order after successful payment (when payment_source='order')"
    )
    
    def validate_amount(self, value):
        """Validate that amount is positive."""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value
    
    def validate_branch_id(self, value):
        """Validate that branch exists and is active."""
        from branches.models import Branch
        try:
            branch = Branch.objects.get(id=value)
            if branch.status != 'active':
                raise serializers.ValidationError("Selected branch is not active.")
        except Branch.DoesNotExist:
            raise serializers.ValidationError("Invalid branch selected.")
        return value


class PaymentReceiptSerializer(serializers.Serializer):
    """Serializer for payment receipt data."""
    transaction_uuid = serializers.CharField()
    transaction_code = serializers.CharField(allow_null=True)
    payment_type = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()
    branch_name = serializers.CharField()
    created_at = serializers.DateTimeField()
    processed_at = serializers.DateTimeField(allow_null=True)
    
    # Orders paid by this payment
    orders_paid = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )


class PaymentVerifySerializer(serializers.Serializer):
    """Serializer for eSewa payment verification."""
    transaction_uuid = serializers.CharField(required=False)
    oid = serializers.CharField(required=False)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    amt = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    transaction_code = serializers.CharField(required=False, allow_blank=True)
    refId = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Ensure we have either new or old parameter format."""
        transaction_uuid = data.get('transaction_uuid') or data.get('oid')
        amount = data.get('amount') or data.get('amt')
        
        if not transaction_uuid:
            raise serializers.ValidationError("transaction_uuid or oid is required")
        if not amount:
            raise serializers.ValidationError("amount or amt is required")
            
        data['transaction_uuid'] = transaction_uuid
        data['amount'] = amount
        data['ref_id'] = data.get('transaction_code') or data.get('refId')
        
        return data
