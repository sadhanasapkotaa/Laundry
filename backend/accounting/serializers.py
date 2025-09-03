"""This file contains serializers for the accounting application, including income and expense models,"""
from rest_framework import serializers
from django.utils import timezone
from .models import Income, Expense, IncomeCategory, ExpenseCategory


class IncomeCategorySerializer(serializers.ModelSerializer):
    """Serializer for IncomeCategory model."""
    class Meta:
        """Meta class for IncomeCategory serializer."""
        model = IncomeCategory
        fields = '__all__'


class ExpenseCategorySerializer(serializers.ModelSerializer):
    """Serializer for ExpenseCategory model."""
    class Meta:
        """Meta class for ExpenseCategory serializer."""
        model = ExpenseCategory
        fields = '__all__'


class IncomeSerializer(serializers.ModelSerializer):
    """Serializer for Income model."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    branch_id_display = serializers.CharField(source='branch.branch_id', read_only=True)
    
    class Meta:
        """Meta class for Income serializer."""
        model = Income
        fields = '__all__'


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for Expense model."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    branch_id_display = serializers.CharField(source='branch.branch_id', read_only=True)
    
    class Meta:
        """Meta class for Expense serializer."""
        model = Expense
        fields = '__all__'


class BaseMetricsSerializer(serializers.Serializer):
    """Base serializer for metrics."""
    total_income = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_expense = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    net_profit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    def create(self, validated_data):
        return validated_data

    def update(self, instance, validated_data):
        return instance


class TimePeriodReportSerializer(BaseMetricsSerializer):
    """Serializer for generating reports based on time periods."""
    period = serializers.ChoiceField(choices=['daily', 'weekly', 'monthly', 'yearly'])
    date = serializers.DateField(required=False)  # For daily
    month = serializers.IntegerField(required=False, min_value=1, max_value=12)
    year = serializers.IntegerField(required=False)
    branch_id = serializers.IntegerField(required=False)
    user_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        current_date = timezone.now().date()

        if attrs.get('year') and attrs['year'] > current_date.year:
            raise serializers.ValidationError("Year cannot be in the future")

        if attrs.get('month') and attrs.get('year') == current_date.year and attrs['month'] > current_date.month:
            raise serializers.ValidationError("Month cannot be in the future")

        if attrs.get('date') and attrs['date'] > current_date:
            raise serializers.ValidationError("Date cannot be in the future")

        return attrs


class BranchInsightsSerializer(serializers.Serializer):
    """Serializer for branch insights."""
    most_profitable_branch = serializers.CharField(read_only=True)
    least_profitable_branch = serializers.CharField(read_only=True)
    most_expensive_branch = serializers.CharField(read_only=True)
    least_expensive_branch = serializers.CharField(read_only=True)
    income_by_branch = serializers.DictField(
        child=serializers.DecimalField(max_digits=12, decimal_places=2), read_only=True
    )
    expenses_by_branch = serializers.DictField(
        child=serializers.DecimalField(max_digits=12, decimal_places=2), read_only=True
    )

    def create(self, validated_data):
        return validated_data

    def update(self, instance, validated_data):
        return instance


class FullAccountingSerializer(serializers.Serializer):
    """Serializer for full accounting data."""
    time_period_report = TimePeriodReportSerializer(read_only=True)
    branch_insights = BranchInsightsSerializer(read_only=True)

    def create(self, validated_data):
        return validated_data

    def update(self, instance, validated_data):
        return instance


# Optional specialized serializers for direct endpoints
class DailyReportSerializer(TimePeriodReportSerializer):
    """Serializer for daily reports."""
    period = serializers.HiddenField(default='daily')


class WeeklyReportSerializer(TimePeriodReportSerializer):
    """Serializer for weekly reports."""
    period = serializers.HiddenField(default='weekly')


class MonthlyReportSerializer(TimePeriodReportSerializer):
    """Serializer for monthly reports."""
    period = serializers.HiddenField(default='monthly')


class YearlyReportSerializer(TimePeriodReportSerializer):
    """Serializer for yearly reports."""
    period = serializers.HiddenField(default='yearly')
