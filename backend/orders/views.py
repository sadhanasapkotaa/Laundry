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


# ---- ORDER STATS VIEW ----

class OrderStatsView(generics.GenericAPIView):
    """View to get order statistics including pending amount."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from django.db.models import Sum, Count, Q, F
        from .models import OrderPayment
        
        user = request.user
        
        # Get orders for this user (customers only see their own)
        if user.is_staff or user.is_superuser or getattr(user, 'role', None) in ['admin', 'branch_manager']:
            orders = Order.objects.all()
        else:
            orders = Order.objects.filter(customer_name=user)
        
        # Calculate statistics - include partially paid orders in pending calculations
        pending_payment_orders = orders.filter(Q(payment_status='pending') | Q(payment_status='partially_paid'))
        
        stats = orders.aggregate(
            total_orders=Count('order_id'),
            active_orders=Count('order_id', filter=Q(status__in=[
                'pending pickup', 'picked up', 'sent to wash', 'in wash', 
                'washed', 'picked by client', 'pending delivery', 'dropped by user'
            ])),
            completed_orders=Count('order_id', filter=Q(status='completed') | Q(status='delivered')),
            pending_payments_count=Count('order_id', filter=Q(payment_status='pending') | Q(payment_status='partially_paid')),
        )
        
        # Calculate pending amount considering partial payments
        total_pending = 0
        for order in pending_payment_orders:
            # Get total amount already paid for this order
            paid_amount = OrderPayment.objects.filter(order=order).aggregate(
                total=Sum('amount_applied')
            )['total'] or 0
            
            # Add remaining amount to total pending
            remaining = order.total_amount - paid_amount
            if remaining > 0:
                total_pending += remaining
        
        stats['pending_amount'] = float(total_pending)
        
        # Get pending orders list with basic info (convert UUID to string)
        pending_orders_qs = pending_payment_orders.values(
            'order_id', 'total_amount', 'status', 'order_date', 'payment_status'
        )[:10]  # Limit to 10 for performance
        
        pending_orders = []
        for order_data in pending_orders_qs:
            order_id = order_data['order_id']
            # Calculate amount already paid
            paid_amount = OrderPayment.objects.filter(order_id=order_id).aggregate(
                total=Sum('amount_applied')
            )['total'] or 0
            
            pending_orders.append({
                'id': str(order_id),
                'order_id': str(order_id),
                'total_amount': float(order_data['total_amount']) if order_data['total_amount'] else 0,
                'paid_amount': float(paid_amount),
                'pending_amount': float(order_data['total_amount'] - paid_amount) if order_data['total_amount'] else 0,
                'status': order_data['status'],
                'payment_status': order_data['payment_status'],
                'order_date': str(order_data['order_date']) if order_data['order_date'] else None,
            })

        # Calculate pending amount per branch (considering partial payments)
        branch_pending = {}
        for order in pending_payment_orders.select_related('branch'):
            # Get amount already paid for this order
            paid_amount = OrderPayment.objects.filter(order=order).aggregate(
                total=Sum('amount_applied')
            )['total'] or 0
            
            remaining = order.total_amount - paid_amount
            if remaining > 0:
                branch_id = order.branch.id
                if branch_id not in branch_pending:
                    branch_pending[branch_id] = {
                        'branch_id': branch_id,
                        'branch_name': order.branch.name,
                        'total_pending': 0
                    }
                branch_pending[branch_id]['total_pending'] += remaining
        
        # Convert to list and sort by branch name
        filtered_branch_amounts = sorted(
            branch_pending.values(),
            key=lambda x: x['branch_name']
        )
        
        return Response({
            'success': True,
            'stats': stats,
            'pending_orders': pending_orders,
            'branch_pending_amounts': filtered_branch_amounts,
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
