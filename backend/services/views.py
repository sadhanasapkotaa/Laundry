# views.py
from rest_framework import viewsets
from .models import Service, WashType, DeliveryType, ServiceCost, IndividualCloth, BulkCloth
from .serializers import (
    ServiceSerializer, WashTypeSerializer, DeliveryTypeSerializer,
    ServiceCostSerializer, IndividualClothSerializer, BulkClothSerializer
)

class ServiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing services."""
    #pylint: disable=no-member
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

class WashTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing wash types."""
    #pylint: disable=no-member
    queryset = WashType.objects.all()
    serializer_class = WashTypeSerializer

class DeliveryTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing delivery types."""
    #pylint: disable=no-member
    queryset = DeliveryType.objects.all()
    serializer_class = DeliveryTypeSerializer

class ServiceCostViewSet(viewsets.ModelViewSet):
    """ViewSet for managing service costs."""
    #pylint: disable=no-member
    queryset = ServiceCost.objects.all()
    serializer_class = ServiceCostSerializer

class IndividualClothViewSet(viewsets.ModelViewSet):
    """ViewSet for managing individual cloth items."""
    #pylint: disable=no-member
    queryset = IndividualCloth.objects.all()
    serializer_class = IndividualClothSerializer

class BulkClothViewSet(viewsets.ModelViewSet):
    """ViewSet for managing bulk cloth items."""
    #pylint: disable=no-member
    queryset = BulkCloth.objects.all()
    serializer_class = BulkClothSerializer
