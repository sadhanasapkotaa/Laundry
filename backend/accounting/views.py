"""Accounting views for handling income and expenses, generating reports, and providing insights."""
from datetime import timedelta
from django.utils import timezone
from django.db import models
from django.db.models import Sum
from django.db.models.functions import TruncWeek, TruncMonth, TruncYear
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework import status

from .models import Income, Expense, IncomeCategory, ExpenseCategory
from branches.models import Branch
from .serializers import (
    TimePeriodReportSerializer,
    BranchInsightsSerializer,
    FullAccountingSerializer,
    IncomeSerializer,
    ExpenseSerializer,
    IncomeCategorySerializer,
    ExpenseCategorySerializer
)

class IncomeViewSet(viewsets.ModelViewSet):
    """ViewSet for handling income records."""
    # pylint: disable=no-member
    pagination_class = PageNumberPagination
    queryset = Income.objects.select_related('branch', 'category').all().order_by('-date_received')
    serializer_class = IncomeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['branch', 'date_received', 'category']

    def get_queryset(self):
        """Optimize queryset with filters."""
        queryset = super().get_queryset()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date_received__gte=start_date)
        if end_date:
            queryset = queryset.filter(date_received__lte=end_date)
        
        return queryset

    @action(detail=False, methods=['get'])
    def by_time(self, request):
        """Get income grouped by time period.
        Query params:
        - period: daily|weekly|monthly|yearly (default: daily)
        - branch: branch ID (optional)
        - start_date: YYYY-MM-DD (optional)
        - end_date: YYYY-MM-DD (optional)
        - limit: number of periods to return (default: 30 for daily, 12 for weekly/monthly, 5 for yearly)
        """
        period = request.query_params.get('period', 'daily')
        branch_id = request.query_params.get('branch')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Set default limits based on period
        default_limits = {'daily': 30, 'weekly': 12, 'monthly': 12, 'yearly': 5}
        limit = int(request.query_params.get('limit', default_limits.get(period, 30)))
        
        # Start with optimized queryset
        qs = Income.objects.all()
        
        # Apply filters
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if start_date:
            qs = qs.filter(date_received__gte=start_date)
        if end_date:
            qs = qs.filter(date_received__lte=end_date)
        
        # Group by period
        if period == 'weekly':
            qs = qs.annotate(period=TruncWeek('date_received'))
        elif period == 'monthly':
            qs = qs.annotate(period=TruncMonth('date_received'))
        elif period == 'yearly':
            qs = qs.annotate(period=TruncYear('date_received'))
        else:  # daily
            qs = qs.annotate(period=models.F('date_received'))
        
        # Aggregate and limit
        data = qs.values('period').annotate(
            total=Sum('amount'),
            count=models.Count('id')
        ).order_by('-period')[:limit]
        
        return Response(list(data))
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get income statistics.
        Query params:
        - period: daily|weekly|monthly|yearly (default: monthly)
        - branch: branch ID (optional)
        """
        period = request.query_params.get('period', 'monthly')
        branch_id = request.query_params.get('branch')
        today = timezone.now().date()
        
        # Build base queryset
        qs = Income.objects.all()
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        
        # Calculate date ranges
        if period == 'daily':
            current_start = today
            previous_start = today - timedelta(days=1)
            previous_end = today - timedelta(days=1)
        elif period == 'weekly':
            current_start = today - timedelta(days=today.weekday())
            previous_start = current_start - timedelta(days=7)
            previous_end = current_start - timedelta(days=1)
        elif period == 'yearly':
            current_start = today.replace(month=1, day=1)
            previous_start = current_start.replace(year=current_start.year - 1)
            previous_end = current_start - timedelta(days=1)
        else:  # monthly
            current_start = today.replace(day=1)
            if current_start.month == 1:
                previous_start = current_start.replace(year=current_start.year - 1, month=12)
            else:
                previous_start = current_start.replace(month=current_start.month - 1)
            previous_end = current_start - timedelta(days=1)
        
        # Get current period stats
        current_income = qs.filter(
            date_received__gte=current_start,
            date_received__lte=today
        ).aggregate(
            total=Sum('amount'),
            count=models.Count('id'),
            avg=models.Avg('amount')
        )
        
        # Get previous period stats for comparison
        previous_income = qs.filter(
            date_received__gte=previous_start,
            date_received__lte=previous_end
        ).aggregate(
            total=Sum('amount'),
            count=models.Count('id')
        )
        
        # Calculate growth percentage
        current_total = current_income['total'] or 0
        previous_total = previous_income['total'] or 0
        growth_percentage = 0
        if previous_total > 0:
            growth_percentage = ((current_total - previous_total) / previous_total) * 100
        
        # Get payment method breakdown (from payment reference)
        payment_methods = {}
        income_records = qs.filter(date_received__gte=current_start, date_received__lte=today)
        for income in income_records.select_related('payment'):
            if hasattr(income, 'payment') and income.payment:
                method = income.payment.payment_type
                payment_methods[method] = payment_methods.get(method, 0) + float(income.amount)
        
        return Response({
            'period': period,
            'current_period': {
                'total': current_total,
                'count': current_income['count'] or 0,
                'average': float(current_income['avg'] or 0),
                'start_date': current_start.isoformat(),
                'end_date': today.isoformat(),
            },
            'previous_period': {
                'total': previous_total,
                'count': previous_income['count'] or 0,
                'start_date': previous_start.isoformat(),
                'end_date': previous_end.isoformat(),
            },
            'growth_percentage': round(growth_percentage, 2),
            'payment_methods': payment_methods,
        })


class ExpenseViewSet(viewsets.ModelViewSet):
    """ViewSet for handling expense records."""
    # pylint: disable=no-member
    pagination_class = PageNumberPagination
    queryset = Expense.objects.all().order_by('-date_incurred')
    serializer_class = ExpenseSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['branch', 'date_incurred', 'category']

    @action(detail=False, methods=['get'])
    def by_time(self, request):
        """period=daily|weekly|monthly|yearly"""
        period = request.query_params.get('period', 'daily')
        qs = self.queryset

        if branch_id := request.query_params.get('branch'):
            qs = qs.filter(branch_id=branch_id)

        if period == 'weekly':
            qs = qs.annotate(period=TruncWeek('date_incurred'))
        elif period == 'monthly':
            qs = qs.annotate(period=TruncMonth('date_incurred'))
        elif period == 'yearly':
            qs = qs.annotate(period=TruncYear('date_incurred'))
        else:
            qs = qs.annotate(period=models.F('date_incurred'))

        data = qs.values('period').annotate(total=Sum('amount')).order_by('-period')
        return Response(data)


class IncomeCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for handling income categories."""
    queryset = IncomeCategory.objects.all().order_by('name')
    serializer_class = IncomeCategorySerializer


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for handling expense categories."""
    queryset = ExpenseCategory.objects.all().order_by('name')
    serializer_class = ExpenseCategorySerializer


class AccountingDataView(APIView):
    """View for fetching dropdown data (branches and categories)."""
    
    def get(self, request):
        """Get all branches and categories for dropdowns."""
        from branches.serializers import BranchSerializer
        
        branches = Branch.objects.filter(status='active').order_by('name')
        income_categories = IncomeCategory.objects.all().order_by('name')
        expense_categories = ExpenseCategory.objects.all().order_by('name')
        
        return Response({
            'branches': BranchSerializer(branches, many=True).data,
            'income_categories': IncomeCategorySerializer(income_categories, many=True).data,
            'expense_categories': ExpenseCategorySerializer(expense_categories, many=True).data,
        }, status=status.HTTP_200_OK)


class TimePeriodReportView(APIView):
    """View for generating income/expense reports based on time period."""

    def post(self, request):
        """Generate report based on the specified time period."""
        serializer = TimePeriodReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        period = data['period']
        branch_id = data.get('branch_id')
        user_id = data.get('user_id')

        today = timezone.now().date()
        filter_kwargs = {}

        if branch_id:
            filter_kwargs['branch_id'] = branch_id
        if user_id:
            filter_kwargs['user_id'] = user_id

        if period == 'daily':
            date = data.get('date', today)
            incomes = Income.objects.filter(date_received=date, **filter_kwargs)  # pylint: disable=no-member
            expenses = Expense.objects.filter(date_incurred=date, **filter_kwargs)  # pylint: disable=no-member

        elif period == 'weekly':
            start_week = today - timedelta(days=today.weekday())
            end_week = start_week + timedelta(days=6)
            # pylint: disable=no-member
            incomes = Income.objects.filter(date_received__range=[start_week, end_week],
                                            **filter_kwargs)
            expenses = Expense.objects.filter(date_incurred__range=[start_week, end_week],
                                              **filter_kwargs)

        elif period == 'monthly':
            year = data.get('year', today.year)
            month = data.get('month', today.month)
            incomes = Income.objects.filter(date_received__year=year, date_received__month=month, **filter_kwargs)  # pylint: disable=no-member
            expenses = Expense.objects.filter(date_incurred__year=year, date_incurred__month=month, **filter_kwargs)  # pylint: disable=no-member

        elif period == 'yearly':
            year = data.get('year', today.year)
            incomes = Income.objects.filter(date_received__year=year, **filter_kwargs)  # pylint: disable=no-member
            expenses = Expense.objects.filter(date_incurred__year=year, **filter_kwargs)  # pylint: disable=no-member

        else:
            return Response({"error": "Invalid period specified."}, status=status.HTTP_400_BAD_REQUEST)
        total_income = incomes.aggregate(total=Sum('amount'))['total'] or 0
        total_expense = expenses.aggregate(total=Sum('amount'))['total'] or 0
        net_profit = total_income - total_expense

        return Response({
            'total_income': total_income,
            'total_expense': total_expense,
            'net_profit': net_profit
        }, status=status.HTTP_200_OK)



class BranchInsightsView(APIView):
    """View for generating branch insights."""
    def get(self, request):
        """Generate insights based on income and expenses by branch."""
        # pylint:disable=no-member
        income_totals = Income.objects.values('branch__name').annotate(total_income=Sum('amount'))
        expense_totals = Expense.objects.values('branch__name').annotate(total_expense=Sum('amount'))

        income_by_branch = {item['branch__name']: item['total_income'] for item in income_totals}
        expenses_by_branch = {item['branch__name']: item['total_expense'] for item in expense_totals}

        most_profitable = max(income_by_branch.items(), key=lambda x: x[1], default=(None, 0))[0]
        least_profitable = min(income_by_branch.items(), key=lambda x: x[1], default=(None, 0))[0]

        most_expensive = max(expenses_by_branch.items(), key=lambda x: x[1], default=(None, 0))[0]
        least_expensive = min(expenses_by_branch.items(), key=lambda x: x[1], default=(None, 0))[0]

        data = {
            'most_profitable_branch': most_profitable,
            'least_profitable_branch': least_profitable,
            'most_expensive_branch': most_expensive,
            'least_expensive_branch': least_expensive,
            'income_by_branch': income_by_branch,
            'expenses_by_branch': expenses_by_branch,
        }

        serializer = BranchInsightsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FullAccountingView(APIView):
    """View for generating full accounting report including time period and branch insights."""
    def get(self, request):
        """Generate full accounting report."""
        time_period_data = request.query_params
        time_period_serializer = TimePeriodReportSerializer(data=time_period_data)
        time_period_serializer.is_valid(raise_exception=True)
        time_report = TimePeriodReportView().post(request).data

        branch_insights = BranchInsightsView().get(request).data

        full_report = {
            'time_period_report': time_report,
            'branch_insights': branch_insights
        }

        serializer = FullAccountingSerializer(full_report)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BranchFinancialSummaryView(APIView):
    """View for generating financial summary by branch showing income and expenses."""
    
    def get(self, request):
        """Get financial summary for all branches or a specific branch."""
        branch_id = request.query_params.get('branch_id')
        
        # Filter by branch if specified
        if branch_id:
            branches = Branch.objects.filter(id=branch_id, status='active')
        else:
            branches = Branch.objects.filter(status='active')
        
        summary = []
        for branch in branches:
            # Get income and expense totals for this branch
            total_income = Income.objects.filter(branch=branch).aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            total_expense = Expense.objects.filter(branch=branch).aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            # Count of income records from payments vs manual
            income_from_payments = Income.objects.filter(
                branch=branch,
                payment__isnull=False
            ).count()
            
            income_manual = Income.objects.filter(
                branch=branch,
                payment__isnull=True
            ).count()
            
            summary.append({
                'branch_id': branch.id,
                'branch_name': branch.name,
                'total_income': total_income,
                'total_expense': total_expense,
                'net_profit': total_income - total_expense,
                'income_records_from_payments': income_from_payments,
                'income_records_manual': income_manual,
            })
        
        return Response({
            'branches': summary,
            'total_branches': len(summary)
        }, status=status.HTTP_200_OK)
