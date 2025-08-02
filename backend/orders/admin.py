""""Admin configuration for the orders application, registering Order and Delivery models."""
from django.contrib import admin
from .models import Order, Delivery

admin.site.register(Order)
admin.site.register(Delivery)
