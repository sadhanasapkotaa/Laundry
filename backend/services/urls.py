from django.urls import path
from .views import (
    ServiceViewSet, WashTypeViewSet, DeliveryTypeViewSet,
    ServiceCostViewSet, IndividualClothViewSet, BulkClothViewSet
)

urlpatterns = [
    # Services
    path('services/', ServiceViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('services/<uuid:pk>/', ServiceViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),

    # Wash Types
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
