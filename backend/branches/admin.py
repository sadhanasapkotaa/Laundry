"""Admin configuration for the branches application, registering Branch and BranchManager models."""
from django.contrib import admin
from .models import Branch, BranchManager
admin.site.register(Branch)
admin.site.register(BranchManager)
