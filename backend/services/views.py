# views.py
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import action
from .models import (
    Service, WashType, DeliveryType, ServiceCost, IndividualCloth, BulkCloth,
    SystemSettings, ClothName, ClothType, PricingRule
)
from .serializers import (
    ServiceSerializer, WashTypeSerializer, DeliveryTypeSerializer,
    ServiceCostSerializer, IndividualClothSerializer, BulkClothSerializer,
    SystemSettingsSerializer, ClothNameSerializer, ClothTypeSerializer,
    PricingRuleSerializer
)


class SystemSettingsView(APIView):
    """API view for system settings (singleton). GET is public, PUT requires admin."""
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        """Get current system settings."""
        settings = SystemSettings.get_settings()
        serializer = SystemSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        """Update system settings (admin only)."""
        settings = SystemSettings.get_settings()
        serializer = SystemSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WashTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing wash types."""
    queryset = WashType.objects.filter(is_active=True)
    serializer_class = WashTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # GET is allowed for authenticated users, but create/update/delete requires admin
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        # For admin, show all; for others, show only active
        if self.request.user.is_staff:
            return WashType.objects.all()
        return WashType.objects.filter(is_active=True)


class ClothNameViewSet(viewsets.ModelViewSet):
    """ViewSet for managing cloth names."""
    queryset = ClothName.objects.filter(is_active=True)
    serializer_class = ClothNameSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # GET is allowed for authenticated users, but create/update/delete requires admin
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        if self.request.user.is_staff:
            return ClothName.objects.all()
        return ClothName.objects.filter(is_active=True)


class ClothTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing cloth types/materials."""
    queryset = ClothType.objects.filter(is_active=True)
    serializer_class = ClothTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # GET is allowed for authenticated users, but create/update/delete requires admin
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        if self.request.user.is_staff:
            return ClothType.objects.all()
        return ClothType.objects.filter(is_active=True)


class PricingRuleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing pricing rules."""
    queryset = PricingRule.objects.filter(is_active=True)
    serializer_class = PricingRuleSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # GET is allowed for authenticated users, but create/update/delete requires admin
        if self.action in ['list', 'retrieve', 'lookup']:
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        if self.request.user.is_staff:
            return PricingRule.objects.all()
        return PricingRule.objects.filter(is_active=True)

    @action(detail=False, methods=['get'])
    def lookup(self, request):
        """Look up price for a specific combination."""
        wash_type_id = request.query_params.get('wash_type')
        cloth_name_id = request.query_params.get('cloth_name')
        cloth_type_id = request.query_params.get('cloth_type')

        if not all([wash_type_id, cloth_name_id, cloth_type_id]):
            return Response(
                {'error': 'wash_type, cloth_name, and cloth_type are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            rule = PricingRule.objects.get(
                wash_type_id=wash_type_id,
                cloth_name_id=cloth_name_id,
                cloth_type_id=cloth_type_id,
                is_active=True
            )
            return Response({'price': str(rule.price)})
        except PricingRule.DoesNotExist:
            return Response({'price': None, 'message': 'No pricing rule found'})


class ServiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing services."""
    #pylint: disable=no-member
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer


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

