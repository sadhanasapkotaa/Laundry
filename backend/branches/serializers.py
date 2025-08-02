"""Serializers for Branch and BranchManager models."""
from rest_framework import serializers
from .models import Branch, BranchManager

class BranchSerializer(serializers.ModelSerializer):
    """Serializer for Branch model."""
    class Meta:
        """Meta class for Branch serializer."""
        model = Branch
        fields = ['id', 'name', 'branch_id', 'branch_manager']

class BranchManagerSerializer(serializers.ModelSerializer):
    """Serializer for BranchManager model."""
    class Meta:
        """Meta class for BranchManager serializer."""
        model = BranchManager
        fields = [
            'manager_id', 'user', 'branch', 'salary',
            'hired_date', 'leaving_date', 'id_type',
            'citizenship_number', 'is_active', 'created', 'modified'
        ]
