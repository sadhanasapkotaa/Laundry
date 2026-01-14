"""Views for managing branches and branch managers in the laundry management system."""
from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from users.permissions import IsAdmin
from .models import Branch, BranchManager
from .serializers import BranchSerializer, BranchManagerSerializer, BranchStatsSerializer

# Branch Views
class BranchListView(generics.ListAPIView):
    """View to list all branches with search, filter, and sorting capabilities."""
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'city']
    search_fields = ['name', 'branch_id', 'address', 'city', 'branch_manager']
    ordering_fields = ['name', 'opening_date', 'created']
    ordering = ['-created']

    def get_queryset(self):
        """Override to filter branches based on user role."""
        queryset = super().get_queryset()
        
        # If user is branch manager, only show their branch
        if hasattr(self.request.user, 'branchmanager') and self.request.user.role == 'branch_manager':
            queryset = queryset.filter(id=self.request.user.branchmanager.branch.id)
        
        # Custom sorting by revenue and expenses
        sort_by = self.request.query_params.get('sort_by')
        if sort_by == 'revenue_high':
            # This would need to be implemented with annotations for proper SQL sorting
            # For now, we'll handle it in the serializer
            pass
        elif sort_by == 'revenue_low':
            pass
        elif sort_by == 'expenses_high':
            pass
        elif sort_by == 'expenses_low':
            pass
            
        return queryset

class BranchCreateView(generics.CreateAPIView):
    """View to create a new branch - Admin only."""
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAdmin]

class BranchDetailView(generics.RetrieveAPIView):
    """View to retrieve details of a specific branch."""
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Override to ensure branch managers can only view their own branch."""
        obj = super().get_object()
        
        # If user is branch manager, ensure they can only access their branch
        if (hasattr(self.request.user, 'branchmanager') and 
            self.request.user.role == 'branch_manager' and
            obj.id != self.request.user.branchmanager.branch.id):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only view your own branch.")
        
        return obj

class BranchUpdateView(generics.UpdateAPIView):
    """View to update a specific branch - Admin only."""
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAdmin]

class BranchDeleteView(generics.DestroyAPIView):
    """View to delete a specific branch - Admin only."""
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAdmin]

class BranchStatsView(generics.RetrieveAPIView):
    """View to get branch statistics - for branch managers and admins."""
    queryset = Branch.objects.all()
    serializer_class = BranchStatsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Override to ensure branch managers can only view their own branch stats."""
        obj = super().get_object()
        
        # If user is branch manager, ensure they can only access their branch stats
        if (hasattr(self.request.user, 'branchmanager') and 
            self.request.user.role == 'branch_manager' and
            obj.id != self.request.user.branchmanager.branch.id):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only view your own branch statistics.")
        
        return obj

# BranchManager Views
class BranchManagerListView(generics.ListAPIView):
    """View to list all branch managers."""
    queryset = BranchManager.objects.all()
    serializer_class = BranchManagerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['branch', 'is_active', 'id_type']
    search_fields = ['manager_id', 'user__email', 'user__first_name', 'user__last_name']
    ordering_fields = ['hired_date', 'salary', 'created']
    ordering = ['-created']

    def get_queryset(self):
        """Override to filter based on user role."""
        queryset = super().get_queryset()
        
        # If user is branch manager, only show managers from their branch
        if hasattr(self.request.user, 'branchmanager') and self.request.user.role == 'branch_manager':
            queryset = queryset.filter(branch=self.request.user.branchmanager.branch)
        
        return queryset

class BranchManagerCreateView(generics.CreateAPIView):
    """View to create a new branch manager - Admin only."""
    queryset = BranchManager.objects.all()
    serializer_class = BranchManagerSerializer
    permission_classes = [IsAdmin]

class BranchManagerDetailView(generics.RetrieveAPIView):
    """View to retrieve details of a specific branch manager."""
    queryset = BranchManager.objects.all()
    serializer_class = BranchManagerSerializer
    permission_classes = [IsAuthenticated]

class BranchManagerUpdateView(generics.UpdateAPIView):
    """View to update a specific branch manager - Admin only."""
    queryset = BranchManager.objects.all()
    serializer_class = BranchManagerSerializer
    permission_classes = [IsAdmin]


class BranchManagerDeleteView(generics.DestroyAPIView):
    """View to delete a specific branch manager - Admin only."""
    queryset = BranchManager.objects.all()
    serializer_class = BranchManagerSerializer
    permission_classes = [IsAdmin]

class BranchOverallPerformanceView(generics.GenericAPIView):
    """View to get overall branch performance statistics over time."""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from django.db.models import Sum
        from django.db.models.functions import TruncDay, TruncMonth
        from django.utils import timezone
        import datetime
        from accounting.models import Income, Expense

        time_range = request.query_params.get('range', '7d')
        now = timezone.now()
        
        # Define time range and grouping
        if time_range == 'today':
            start_date = now - datetime.timedelta(days=1)
            trunc_func = TruncDay
            date_field_income = 'date_received'
            date_field_expense = 'date_incurred'
        elif time_range == '7d':
            start_date = now - datetime.timedelta(days=7)
            trunc_func = TruncDay
            date_field_income = 'date_received'
            date_field_expense = 'date_incurred'
        elif time_range == '1m':
            start_date = now - datetime.timedelta(days=30)
            trunc_func = TruncDay
            date_field_income = 'date_received'
            date_field_expense = 'date_incurred'
        elif time_range == '1y':
            start_date = now - datetime.timedelta(days=365)
            trunc_func = TruncMonth
            date_field_income = 'date_received'
            date_field_expense = 'date_incurred'
        else: # Default 7d
            start_date = now - datetime.timedelta(days=7)
            trunc_func = TruncDay
            date_field_income = 'date_received'
            date_field_expense = 'date_incurred'

        # Filter and Aggregate Income
        income_qs = Income.objects.filter(**{f"{date_field_income}__gte": start_date})
        
        # Check permissions - filter by branch if manager
        if hasattr(request.user, 'branchmanager') and request.user.role == 'branch_manager':
            income_qs = income_qs.filter(branch=request.user.branchmanager.branch)
            
        income_data = income_qs.annotate(
            period=trunc_func(date_field_income)
        ).values('period').annotate(
            total=Sum('amount')
        ).order_by('period')

        # Filter and Aggregate Expenses
        expense_qs = Expense.objects.filter(**{f"{date_field_expense}__gte": start_date})

        # Check permissions - filter by branch if manager
        if hasattr(request.user, 'branchmanager') and request.user.role == 'branch_manager':
            expense_qs = expense_qs.filter(branch=request.user.branchmanager.branch)

        expense_data = expense_qs.annotate(
            period=trunc_func(date_field_expense)
        ).values('period').annotate(
            total=Sum('amount')
        ).order_by('period')

        # Merge Data
        performance_data = {}
        
        # Format dates matches the TruncMonth/Day output
        for entry in income_data:
            period = entry['period'].strftime('%Y-%m-%d')
            if period not in performance_data:
                performance_data[period] = {'date': period, 'revenue': 0, 'expenses': 0}
            performance_data[period]['revenue'] = float(entry['total'] or 0)

        for entry in expense_data:
            period = entry['period'].strftime('%Y-%m-%d')
            if period not in performance_data:
                performance_data[period] = {'date': period, 'revenue': 0, 'expenses': 0}
            performance_data[period]['expenses'] = float(entry['total'] or 0)

        # Calculate Profit
        result = []
        for period in sorted(performance_data.keys()):
            data = performance_data[period]
            data['profit'] = data['revenue'] - data['expenses']
            result.append(data)

        return Response(result)

class BranchPerformanceView(generics.GenericAPIView):
    """View to get performance statistics for a specific branch over time."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        from rest_framework.response import Response
        from django.db.models import Sum, Count
        from django.db.models.functions import TruncDay, TruncMonth
        from django.utils import timezone
        import datetime
        from accounting.models import Income, Expense
        from orders.models import Order
        
        # Verify branch exists
        try:
            branch = Branch.objects.get(pk=pk)
        except Branch.DoesNotExist:
            return Response({'error': 'Branch not found'}, status=404)
            
        # Permission check: Branch manager can only see their own branch
        if hasattr(request.user, 'branchmanager') and request.user.role == 'branch_manager':
            if request.user.branchmanager.branch.id != int(pk):
                return Response({'error': 'Permission denied'}, status=403)

        time_range = request.query_params.get('range', '6m') # Default 6 months for detailed view
        now = timezone.now()
        
        # Define time range
        if time_range == '1m':
             start_date = now - datetime.timedelta(days=30)
             trunc_func = TruncDay
             orders_trunc = TruncDay
             date_format = '%Y-%m-%d'
        elif time_range == '1y':
             start_date = now - datetime.timedelta(days=365)
             trunc_func = TruncMonth
             orders_trunc = TruncMonth
             date_format = '%Y-%m-%d' # Will format as YYYY-MM-01
        else: # Default 6m (custom logic for "monthly" view usually expected on detailed pages)
             start_date = now - datetime.timedelta(days=180)
             trunc_func = TruncMonth
             orders_trunc = TruncMonth
             date_format = '%Y-%m-%d'

        # 1. Income
        income_data = Income.objects.filter(
            branch=branch, 
            date_received__gte=start_date
        ).annotate(
            period=trunc_func('date_received')
        ).values('period').annotate(
            total=Sum('amount')
        ).order_by('period')

        # 2. Expenses
        expense_data = Expense.objects.filter(
            branch=branch,
            date_incurred__gte=start_date
        ).annotate(
            period=trunc_func('date_incurred')
        ).values('period').annotate(
            total=Sum('amount')
        ).order_by('period')

        # 3. Orders (Count)
        orders_data = Order.objects.filter(
            branch=branch,
            created_at__gte=start_date
        ).annotate(
            period=orders_trunc('created_at')
        ).values('period').annotate(
            count=Count('order_id')
        ).order_by('period')

        # Merge Data
        merged_data = {}

        def add_to_merged(queryset, key, value_key):
            for entry in queryset:
                period = entry['period'].strftime('%Y-%m') # Key by Month
                if time_range == '1m':
                    period = entry['period'].strftime('%Y-%m-%d') # Key by Day

                if period not in merged_data:
                    merged_data[period] = {
                        'month': entry['period'].strftime('%b') if time_range != '1m' else entry['period'].strftime('%d %b'),
                        'full_date': period,
                        'revenue': 0, 
                        'expenses': 0, 
                        'orders': 0
                    }
                merged_data[period][key] = float(entry[value_key] or 0)

        add_to_merged(income_data, 'revenue', 'total')
        add_to_merged(expense_data, 'expenses', 'total')
        add_to_merged(orders_data, 'orders', 'count')

        # Sort and return list
        result = [merged_data[k] for k in sorted(merged_data.keys())]
        return Response(result)

class BranchExpenseBreakdownView(generics.GenericAPIView):
    """View to get expense breakdown by category for a specific branch."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        from rest_framework.response import Response
        from django.db.models import Sum
        from accounting.models import Expense
        from django.utils import timezone
        import datetime
        
         # Verify branch exists
        try:
            branch = Branch.objects.get(pk=pk)
        except Branch.DoesNotExist:
            return Response({'error': 'Branch not found'}, status=404)

        # Permission check
        if hasattr(request.user, 'branchmanager') and request.user.role == 'branch_manager':
            if request.user.branchmanager.branch.id != int(pk):
                return Response({'error': 'Permission denied'}, status=403)

        time_range = request.query_params.get('range', '1m') # Default this month
        now = timezone.now()

        if time_range == '1m':
            start_date = now - datetime.timedelta(days=30)
        elif time_range == '1y':
            start_date = now - datetime.timedelta(days=365)
        else:
             start_date = now - datetime.timedelta(days=30)

        breakdown = Expense.objects.filter(
            branch=branch,
            date_incurred__gte=start_date
        ).values('category__name').annotate(
            value=Sum('amount')
        ).order_by('-value')

        # Format for Recharts (name, value, color - optional)
        # We'll generate colors on frontend or hardcode a palette here
        result = []
        colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
        
        for i, item in enumerate(breakdown):
            name = item['category__name'] or 'Uncategorized'
            result.append({
                'name': name,
                'value': float(item['value']),
                'color': colors[i % len(colors)]
            })

        return Response(result)

