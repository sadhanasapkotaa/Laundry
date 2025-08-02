"""Admin configuration for managing payments and subscriptions in the Django admin interface."""
# payments/admin.py
from django.contrib import admin
from .models import Payment, Subscription

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin interface for managing payments."""
    list_display = ['transaction_uuid', 'user', 'total_amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['transaction_uuid', 'user__username', 'user__email', 'transaction_code']
    readonly_fields = ['transaction_uuid', 'created_at', 'updated_at']

    fieldsets = (
        ('Transaction Info', {
            'fields': ('user', 'transaction_uuid', 'transaction_code', 'ref_id')
        }),
        ('Payment Details', {
            'fields': ('amount', 'tax_amount', 'total_amount', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    """Admin interface for managing user subscriptions."""
    list_display = ['user', 'is_active', 'start_date', 'end_date', 'payment']
    list_filter = ['is_active', 'start_date', 'end_date']
    search_fields = ['user__username', 'user__email', 'payment__transaction_uuid']
    readonly_fields = ['created_at']

    fieldsets = (
        ('Subscription Info', {
            'fields': ('user', 'payment', 'is_active')
        }),
        ('Duration', {
            'fields': ('start_date', 'end_date')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
