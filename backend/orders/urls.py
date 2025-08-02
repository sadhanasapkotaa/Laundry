"""URL configuration for the orders application, defining 
endpoints for Order and Delivery models."""
from django.urls import path
from .views import (
    OrderListView, OrderCreateView, OrderDetailView, OrderUpdateView, OrderDeleteView,
    DeliveryListView, DeliveryCreateView, DeliveryDetailView, DeliveryUpdateView, DeliveryDeleteView
)

urlpatterns = [
    # Order endpoints
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/create/', OrderCreateView.as_view(), name='order-create'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/update/', OrderUpdateView.as_view(), name='order-update'),
    path('orders/<int:pk>/delete/', OrderDeleteView.as_view(), name='order-delete'),

    # Delivery endpoints
    path('deliveries/', DeliveryListView.as_view(), name='delivery-list'),
    path('deliveries/create/', DeliveryCreateView.as_view(), name='delivery-create'),
    path('deliveries/<int:pk>/', DeliveryDetailView.as_view(), name='delivery-detail'),
    path('deliveries/<int:pk>/update/', DeliveryUpdateView.as_view(), name='delivery-update'),
    path('deliveries/<int:pk>/delete/', DeliveryDeleteView.as_view(), name='delivery-delete'),
]
