from django.urls import path
from .views import (
    ServiceViewSet, WashTypeViewSet, DeliveryTypeViewSet,
    ServiceCostViewSet, IndividualClothViewSet, BulkClothViewSet,
    SystemSettingsView, ClothNameViewSet, ClothTypeViewSet, PricingRuleViewSet
)

urlpatterns = [
    # System Settings (singleton)
    path('settings/', SystemSettingsView.as_view(), name='system-settings'),

    # Wash Types
    path('wash-types/', WashTypeViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('wash-types/<int:pk>/', WashTypeViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),

    # Cloth Names
    path('cloth-names/', ClothNameViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('cloth-names/<int:pk>/', ClothNameViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),

    # Cloth Types (materials)
    path('cloth-types/', ClothTypeViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('cloth-types/<int:pk>/', ClothTypeViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),

    # Pricing Rules
    path('pricing-rules/', PricingRuleViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('pricing-rules/<int:pk>/', PricingRuleViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('pricing-rules/lookup/', PricingRuleViewSet.as_view({'get': 'lookup'})),

    # Services (legacy)
    path('services/', ServiceViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('services/<uuid:pk>/', ServiceViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),

    # Wash Types (legacy path)
    path('washtypes/', WashTypeViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('washtypes/<int:pk>/', WashTypeViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),

    # Delivery Types
    path('deliverytypes/', DeliveryTypeViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('deliverytypes/<int:pk>/', DeliveryTypeViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),

    # Service Costs
    path('servicecosts/', ServiceCostViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('servicecosts/<int:pk>/', ServiceCostViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),

    # Individual Cloth
    path('individualcloths/', IndividualClothViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('individualcloths/<int:pk>/', IndividualClothViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),

    # Bulk Cloth
    path('bulkcloths/', BulkClothViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('bulkcloths/<int:pk>/', BulkClothViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),
]

