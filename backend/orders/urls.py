from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderListView, OrderCreateView, OrderDetailView, OrderUpdateView, OrderDeleteView, OrderStatsView,
    DeliveryListView, DeliveryCreateView, DeliveryDetailView, DeliveryUpdateView, DeliveryDeleteView,
    UserAddressViewSet
)

router = DefaultRouter()
router.register(r'addresses', UserAddressViewSet, basename='user-addresses')

urlpatterns = [
    # Order endpoints
    path('', OrderListView.as_view(), name='order-list'),
    path('create/', OrderCreateView.as_view(), name='order-create'),
    path('stats/', OrderStatsView.as_view(), name='order-stats'),
    path('<uuid:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<uuid:pk>/update/', OrderUpdateView.as_view(), name='order-update'),
    path('<uuid:pk>/delete/', OrderDeleteView.as_view(), name='order-delete'),

    # Delivery endpoints
    path('deliveries/', DeliveryListView.as_view(), name='delivery-list'),
    path('deliveries/create/', DeliveryCreateView.as_view(), name='delivery-create'),
    path('deliveries/<int:pk>/', DeliveryDetailView.as_view(), name='delivery-detail'),
    path('deliveries/<int:pk>/update/', DeliveryUpdateView.as_view(), name='delivery-update'),
    path('deliveries/<int:pk>/delete/', DeliveryDeleteView.as_view(), name='delivery-delete'),
    
    # User Address endpoints
    path('', include(router.urls)),
]
