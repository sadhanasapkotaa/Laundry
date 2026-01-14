"""This file contains views for handling orders and deliveries in the laundry management system."""
from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated
from django.db import models
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
        from django.db import transaction
        from payments.models import Payment
        from .models import OrderPayment        
        logger = logging.getLogger(__name__)
        logger.info(f"=== ORDER CREATE REQUEST ===")
        logger.info(f"User: {request.user} (ID: {request.user.id if request.user.is_authenticated else 'N/A'})")
        logger.info(f"Request data: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Use atomic transaction to ensure consistency
            with transaction.atomic():
                order = serializer.save()
                logger.info(f"Order created successfully: {order.order_id}")
                
                # Check for advance payments and apply them to this order
                self._apply_advance_payments(order, request.user)
                
                # Assign to rider
                self._assign_to_rider(order)

                # Use OrderSerializer for response (i has proper SerializerMethodField for dates)
                response_serializer = OrderSerializer(order, context={'request': request})
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Order creation failed: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _assign_to_rider(self, order):
        """
        Assigns the order's deliveries to the first available rider.
        """
        import logging
        from django.contrib.auth import get_user_model
        
        logger = logging.getLogger(__name__)
        User = get_user_model()
        
        # Find a rider (simplest logic: first one found)
        # In a real app, this would be more complex (location based, load balancing, etc.)
        rider = User.objects.filter(role='rider').first()
        
        if rider:
            # Assign to all deliveries associated with this order
            deliveries = Delivery.objects.filter(order=order)
            updated_count = deliveries.update(delivery_person=rider)
            logger.info(f"Assigned {updated_count} deliveries for Order {order.order_id} to Rider {rider.email}")
            
            # Notify rider (TODO: Implement notification system)
        else:
            logger.warning(f"No riders found to assign Order {order.order_id}")
    
    def _apply_advance_payments(self, order, user):
        """
        Apply any available advance payments to the newly created order.
        This method finds advance payments for the same branch and applies them to the order.
        """
        import logging
        from django.db.models import Sum
        from payments.models import Payment
        from .models import OrderPayment
        
        logger = logging.getLogger(__name__)        
        # Get advance payments for this user and branch (payments with remaining balance)
        advance_payments = Payment.objects.filter(
            user=user,
            branch=order.branch,
            status='COMPLETE'
        ).annotate(
            total_applied=Sum('order_payments__amount_applied')
        ).filter(
            models.Q(total_applied__lt=models.F('total_amount')) | models.Q(total_applied__isnull=True)
        ).order_by('created_at')  # Oldest first
        
        logger.info(f"[ADVANCE_PAYMENT] Found {advance_payments.count()} advance payments for user {user.id} and branch {order.branch.id}")
        
        # Use Decimal for consistent arithmetic operations
        from decimal import Decimal
        remaining_order_amount = Decimal(str(order.total_amount))
        
        for payment in advance_payments:
            if remaining_order_amount <= 0:
                break
                
            # Calculate remaining balance on this payment
            total_applied = payment.total_applied or Decimal('0')
            payment_remaining = payment.total_amount - total_applied
            
            if payment_remaining <= 0:
                continue  # Skip fully consumed payments
                
            # Apply advance payment to order
            amount_to_apply = min(payment_remaining, remaining_order_amount)
            
            logger.info(f"[ADVANCE_PAYMENT] Applying Rs.{amount_to_apply} from advance payment {payment.transaction_uuid} to order {order.order_id}")
            
            # Create OrderPayment record
            OrderPayment.objects.create(
                order=order,
                payment=payment,
                amount_applied=amount_to_apply
            )
            
            # Update order payment status
            remaining_order_amount -= amount_to_apply
            
            # Log consumption status
            if amount_to_apply >= payment_remaining:
                logger.info(f"[ADVANCE_PAYMENT] Advance payment {payment.transaction_uuid} fully consumed")
            else:
                remaining_after_application = payment_remaining - amount_to_apply
                logger.info(f"[ADVANCE_PAYMENT] Advance payment {payment.transaction_uuid} partially consumed, remaining: Rs.{remaining_after_application}")
        
        # Update order payment status based on how much was applied
        if remaining_order_amount <= 0:
            order.payment_status = 'paid'
            logger.info(f"[ADVANCE_PAYMENT] Order {order.order_id} fully paid with advance payments")
        elif remaining_order_amount < Decimal(str(order.total_amount)):
            order.payment_status = 'partially_paid'
            logger.info(f"[ADVANCE_PAYMENT] Order {order.order_id} partially paid with advance payments, remaining: Rs.{remaining_order_amount}")
        else:
            order.payment_status = 'pending'
            logger.info(f"[ADVANCE_PAYMENT] Order {order.order_id} not paid with advance payments, pending: Rs.{remaining_order_amount}")
        
        order.save()

class OrderListView(generics.ListAPIView):
    """View to list all orders."""
    # pylint: disable=no-member
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return orders based on user role.
        
        Customers see only their own orders.
        Branch managers see only their branch's orders.
        Admins see all orders.
        """
        user = self.request.user
        
        # Admin sees all orders
        if user.is_superuser or getattr(user, 'role', None) == 'admin':
            return Order.objects.all().order_by('-order_date')
        
        # Branch manager sees only their branch's orders
        if hasattr(user, 'branchmanager') and getattr(user, 'role', None) == 'branch_manager':
            return Order.objects.filter(branch=user.branchmanager.branch).order_by('-order_date')
        
        # Customers see only their own orders
        return Order.objects.filter(customer_name=user).order_by('-order_date')

class OrderDetailView(generics.RetrieveAPIView):
    """View to retrieve details of a specific order."""
    # pylint: disable=no-member
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return orders based on user role."""
        user = self.request.user
        
        # Admin sees all orders
        if user.is_superuser or getattr(user, 'role', None) == 'admin':
            return Order.objects.all()
        
        # Branch manager sees only their branch's orders
        if hasattr(user, 'branchmanager') and getattr(user, 'role', None) == 'branch_manager':
            return Order.objects.filter(branch=user.branchmanager.branch)
        
        # Customers see only their own orders
        return Order.objects.filter(customer_name=user)

class OrderUpdateView(generics.UpdateAPIView):
    """View to update an existing order."""
    # pylint: disable=no-member
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return orders based on user role."""
        user = self.request.user
        
        # Admin sees all orders
        if user.is_superuser or getattr(user, 'role', None) == 'admin':
            return Order.objects.all()
        
        # Branch manager sees only their branch's orders
        if hasattr(user, 'branchmanager') and getattr(user, 'role', None) == 'branch_manager':
            return Order.objects.filter(branch=user.branchmanager.branch)
        
        # Customers see only their own orders
        return Order.objects.filter(customer_name=user)

class OrderDeleteView(generics.DestroyAPIView):
    """View to delete an existing order."""
    # pylint: disable=no-member
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return orders based on user role."""
        user = self.request.user
        
        # Admin sees all orders
        if user.is_superuser or getattr(user, 'role', None) == 'admin':
            return Order.objects.all()
        
        # Branch manager sees only their branch's orders
        if hasattr(user, 'branchmanager') and getattr(user, 'role', None) == 'branch_manager':
            return Order.objects.filter(branch=user.branchmanager.branch)
        
        # Customers see only their own orders
        return Order.objects.filter(customer_name=user)


# ---- ORDER STATS VIEW ----

class OrderStatsView(generics.GenericAPIView):
    """View to get order statistics including pending amount."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from django.db.models import Sum, Count, Q, F
        from .models import OrderPayment
        
        user = request.user
        
        # Get orders based on user role
        if user.is_superuser or getattr(user, 'role', None) == 'admin':
            # Admin sees all orders
            orders = Order.objects.all()
        elif hasattr(user, 'branchmanager') and getattr(user, 'role', None) == 'branch_manager':
            # Branch manager sees only their branch's orders
            orders = Order.objects.filter(branch=user.branchmanager.branch)
        else:
            # Customers see only their own orders
            orders = Order.objects.filter(customer_name=user)
        
        # Get time range from request
        time_range = request.query_params.get('range', '7d')
        
        from django.utils import timezone
        import datetime
        from django.db.models.functions import TruncDay, TruncMonth
        
        now = timezone.now()
        start_date = now - datetime.timedelta(days=7) # Default 7d
        trunc_func = TruncDay('order_date')
        date_format = '%A' # Day name
        
        if time_range == '1m':
            start_date = now - datetime.timedelta(days=30)
            trunc_func = TruncDay('order_date')
            date_format = '%d %b' # 12 Jan
        elif time_range == '1y':
            start_date = now - datetime.timedelta(days=365)
            trunc_func = TruncMonth('order_date')
            date_format = '%B' # Month name

        # Filter orders by date range
        range_orders = orders.filter(order_date__gte=start_date)

        # 1. Chart Data (Orders & Income over time)
        chart_data_raw = range_orders.annotate(
            period=trunc_func
        ).values('period').annotate(
            orders=Count('order_id'),
            income=Sum('total_amount', filter=Q(payment_status='paid')),
        ).order_by('period')

        chart_data = []
        for entry in chart_data_raw:
            if entry['period']:
                chart_data.append({
                    'label': entry['period'].strftime(date_format),
                    'date': entry['period'].strftime('%Y-%m-%d'),
                    'orders': entry['orders'],
                    'income': float(entry['income'] or 0)
                })

        # 2. Service Distribution (Top 5)
        # Using OrderItem to count service usage
        from .models import OrderItem
        service_dist_raw = OrderItem.objects.filter(
            order__in=range_orders
        ).values('service_type').annotate(
            value=Count('id')
        ).order_by('-value')[:5]

        service_distribution = [
            {'name': item['service_type'], 'value': item['value']}
            for item in service_dist_raw
        ]

        # 3. Branch Performance
        branch_perf_raw = range_orders.values(
            'branch__name'
        ).annotate(
            orders=Count('order_id'),
            income=Sum('total_amount', filter=Q(payment_status='paid'))
        ).order_by('-income')[:5]

        branch_performance = [
            {
                'branch': item['branch__name'], 
                'orders': item['orders'], 
                'income': float(item['income'] or 0)
            }
            for item in branch_perf_raw
        ]

        # 4. Recent Activity (Latest 5 items from Orders, Deliveries, Payments)
        # For simplicity, we'll just show recent Orders and their status changes
        recent_activity_orders = orders.order_by('-order_date')[:5]
        recent_activity = []
        for o in recent_activity_orders:
            recent_activity.append({
                'action': f"Order #{str(o.order_id)[:8]} {o.status}",
                'time': o.order_date, # Serializer will format this or we do it here
                'type': 'order'
            })
            
        # Stats Cards (Totals for the selected range)
        range_stats = range_orders.aggregate(
            total_orders=Count('order_id'),
            total_income=Sum('total_amount', filter=Q(payment_status='paid')),
        )
        
        # ACTVE ORDERS: Should be a snapshot of CURRENT active orders, not filtered by date range
        # Also added 'dropped by user' to active statuses
        active_orders_count = orders.filter(
            status__in=[
                'dropped by user', 'pending pickup', 'picked up', 'sent to wash', 'in wash', 
                'washed', 'picked by client', 'pending delivery', 'pending', 'in progress'
            ]
        ).count()

        return Response({
            'success': True,
            'time_range': time_range,
            'stats': {
                'total_orders': range_stats['total_orders'] or 0,
                'total_income': float(range_stats['total_income'] or 0),
                'active_orders': active_orders_count,
            },
            'chart_data': chart_data,
            'service_distribution': service_distribution,
            'branch_performance': branch_performance,
            'recent_activity': recent_activity, # Need frontend to format time
            # Keep legacy support for pending amounts block if needed, or remove if dashboard doesn't use it
             # 'pending_orders': ... (omitted for dashboard performance, use separate endpoint if needed)
        })


# ---- DELIVERY VIEWS ----

class DeliveryListView(generics.ListAPIView):
    """View to list all deliveries."""
    # pylint: disable=no-member
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return deliveries based on user role.
        Riders see only their assigned deliveries.
        """
        user = self.request.user
        if getattr(user, 'role', None) == 'rider':
            return Delivery.objects.filter(delivery_person=user).order_by('-delivery_date')
        return Delivery.objects.all().order_by('-delivery_date')

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

    def perform_update(self, serializer):
        """
        Update delivery status and related order status if applicable.
        """
        instance = serializer.save()
        
        # If delivery type is pickup and status is delivered, update order status to 'picked up'
        if instance.delivery_type == 'pickup' and instance.status == 'delivered':
            order = instance.order
            # Only update if order is in 'pending pickup' state to avoid overwriting other statuses
            if order.status == 'pending pickup':
                order.status = 'picked up'
                order.save()
                
        # If delivery type is drop (delivery to customer) and status is delivered, update order status to 'delivered'
        if instance.delivery_type == 'drop' and instance.status == 'delivered':
            order = instance.order
            order.status = 'delivered'
            order.save()

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
