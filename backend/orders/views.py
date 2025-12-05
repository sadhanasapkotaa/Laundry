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
        from rest_framework.response import Response
        from rest_framework import status
        
        logger = logging.getLogger(__name__)
        logger.info(f"=== ORDER CREATE REQUEST ===")
        logger.info(f"User: {request.user} (ID: {request.user.id if request.user.is_authenticated else 'N/A'})")
        logger.info(f"Request data: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            order = serializer.save()
            logger.info(f"Order created successfully: {order.order_id}")
            # Use OrderSerializer for response (it has proper SerializerMethodField for dates)
            response_serializer = OrderSerializer(order, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Order creation failed: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OrderListView(generics.ListAPIView):
    """View to list all orders."""
    # pylint: disable=no-member
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return orders based on user role.
        
        Customers see only their own orders.
        Admin and branch managers see all orders.
        """
        user = self.request.user
        # Check if user is admin or staff
        if user.is_staff or user.is_superuser or getattr(user, 'role', None) in ['admin', 'branch_manager']:
            return Order.objects.all().order_by('-order_date')
        # For regular customers, only show their orders
        return Order.objects.filter(customer_name=user).order_by('-order_date')

class OrderDetailView(generics.RetrieveAPIView):
    """View to retrieve details of a specific order."""
    # pylint: disable=no-member
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return orders based on user role."""
        user = self.request.user
        if user.is_staff or user.is_superuser or getattr(user, 'role', None) in ['admin', 'branch_manager']:
            return Order.objects.all()
        return Order.objects.filter(customer_name=user)

class OrderUpdateView(generics.UpdateAPIView):
    """View to update an existing order."""
    # pylint: disable=no-member
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return orders based on user role."""
        user = self.request.user
        if user.is_staff or user.is_superuser or getattr(user, 'role', None) in ['admin', 'branch_manager']:
            return Order.objects.all()
        return Order.objects.filter(customer_name=user)

class OrderDeleteView(generics.DestroyAPIView):
    """View to delete an existing order."""
    # pylint: disable=no-member
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return orders based on user role."""
        user = self.request.user
        if user.is_staff or user.is_superuser or getattr(user, 'role', None) in ['admin', 'branch_manager']:
            return Order.objects.all()
        return Order.objects.filter(customer_name=user)


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
