"""Accounting URL configuration for handling income, expenses, and reports."""
from django.urls import path
from .views import (
    IncomeViewSet,
    ExpenseViewSet,
    IncomeCategoryViewSet,
    ExpenseCategoryViewSet,
    AccountingDataView,
    TimePeriodReportView,
    BranchInsightsView,
    FullAccountingView,
    BranchFinancialSummaryView,
)

APP_NAME = 'accounting'

urlpatterns = [
    # Data URLs
    path('data/', AccountingDataView.as_view(), name='accounting-data'),
    
    # Income URLs
    path('income/', IncomeViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='income-list-create'),
    path('income/<int:pk>/', IncomeViewSet.as_view(
        {'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='income-detail'),
    path('income/by-time/', IncomeViewSet.as_view({'get': 'by_time'}), name='income-by-time'),
    path('income/statistics/', IncomeViewSet.as_view({'get': 'statistics'}), name='income-statistics'),
    
    # Expense URLs
    path('expenses/', ExpenseViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='expense-list-create'),
    path('expenses/<int:pk>/', ExpenseViewSet.as_view(
        {'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='expense-detail'),
    path('expenses/by-time/', ExpenseViewSet.as_view({'get': 'by_time'}), name='expense-by-time'),
    
    # Income Category URLs
    path('income-categories/', IncomeCategoryViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='income-category-list-create'),
    path('income-categories/<int:pk>/', IncomeCategoryViewSet.as_view(
        {'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='income-category-detail'),
    
    # Expense Category URLs
    path('expense-categories/', ExpenseCategoryViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='expense-category-list-create'),
    path('expense-categories/<int:pk>/', ExpenseCategoryViewSet.as_view(
        {'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='expense-category-detail'),
    
    # Report URLs
    path('reports/time-period/', TimePeriodReportView.as_view(), name='time-period-report'),
    path('reports/branch-insights/', BranchInsightsView.as_view(), name='branch-insights'),
    path('reports/full-accounting/', FullAccountingView.as_view(), name='full-accounting-report'),
    path('reports/branch-summary/', BranchFinancialSummaryView.as_view(), name='branch-financial-summary'),
]