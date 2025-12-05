"""This file contains views for handling orders and deliveries in the laundry management system."""
from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Order, Delivery, UserAddress
from .serializers import OrderSerializer, DeliverySerializer, OrderCreateSerializer, UserAddressSerializer

# ---- ORDER VIEWS ----
class OrderCreateView(generics.CreateAPIView):
    """View to create a new order."""
    # pylint: disable=no-member
    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer
    permission_classes = [IsAuthenticated]
    def create(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Order create request data: {request.data}")
        logger.info(f"User: {request.user}")
        
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Order creation failed: {str(e)}")
            raise

class OrderListView(generics.ListAPIView):
    """View to list all orders."""
    # pylint: disable=no-member
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

class OrderDetailView(generics.RetrieveAPIView):
    """View to retrieve details of a specific order."""
    # pylint: disable=no-member
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

class OrderUpdateView(generics.UpdateAPIView):
    """View to update an existing order."""
    # pylint: disable=no-member
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

class OrderDeleteView(generics.DestroyAPIView):
    """View to delete an existing order."""
    # pylint: disable=no-member
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]


# ---- DELIVERY VIEWS ----

class DeliveryListView(generics.ListAPIView):
    """View to list all deliveries."""
    # pylint: disable=no-member
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]

class DeliveryCreateView(generics.CreateAPIView):
    """View to create a new delivery."""
    # pylint: disable=no-member
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]

class DeliveryDetailView(generics.RetrieveAPIView):
    """View to retrieve details of a specific delivery."""
    # pylint: disable=no-member
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]

class DeliveryUpdateView(generics.UpdateAPIView):
    """View to update an existing delivery."""
    # pylint: disable=no-member
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]

class DeliveryDeleteView(generics.DestroyAPIView):
    """View to delete an existing delivery."""
    # pylint: disable=no-member
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]


# ---- USER ADDRESS VIEWS ----

class UserAddressViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user addresses."""
    serializer_class = UserAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return addresses for the authenticated user only."""
        # pylint: disable=no-member
        return UserAddress.objects.filter(user=self.request.user)
