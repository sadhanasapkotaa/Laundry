"""This file contains views for handling orders and deliveries in the laundry management system."""
import logging
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Order, Delivery
from .serializers import OrderSerializer, DeliverySerializer, OrderCreateSerializer

logger = logging.getLogger(__name__)

# ---- ORDER VIEWS ----

class OrderListView(generics.ListAPIView):
    """View to list all orders."""
    # pylint: disable=no-member
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

class OrderCreateView(generics.CreateAPIView):
    """View to create a new order."""
    # pylint: disable=no-member
    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Enhanced create method with better error logging."""
        logger.info(f"Order creation request from user: {request.user}")
        logger.info(f"Request data: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Serializer validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            logger.info(f"Order created successfully: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
    
    def update(self, request, *args, **kwargs):
        """Enhanced update method with better error logging."""
        logger.info(f"Order update request from user: {request.user}")
        logger.info(f"Order ID: {kwargs.get('pk')}")
        logger.info(f"Request data: {request.data}")
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if not serializer.is_valid():
            logger.error(f"Serializer validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_update(serializer)
            logger.info(f"Order updated successfully: {serializer.data}")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating order: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
