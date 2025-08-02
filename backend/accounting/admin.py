"""Admin configuration for the accounting application, registering Income and Expense models."""
from django.contrib import admin
from .models import Income, Expense
admin.site.register(Income)
admin.site.register(Expense)
