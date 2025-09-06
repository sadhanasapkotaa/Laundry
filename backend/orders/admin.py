""""Admin configuration for the orders application, registering Order and Delivery models."""
from django.contrib import admin
from .models import Order, OrderItem, Delivery

admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Delivery)
