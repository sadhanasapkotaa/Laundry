"""Accounting URL configuration for handling income, expenses, and reports."""
from django.urls import path
from .views import (
    IncomeViewSet,
    ExpenseViewSet,
    TimePeriodReportView,
    BranchInsightsView,
    FullAccountingView,
)

APP_NAME = 'accounting'

urlpatterns = [
    path('income/', IncomeViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='income-list-create'),
    path('income/<int:pk>/', IncomeViewSet.as_view(
        {'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='income-detail'),
    path('income/by-time/', IncomeViewSet.as_view({'get': 'by_time'}), name='income-by-time'),
    path('expenses/', ExpenseViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='expense-list-create'),
    path('expenses/<int:pk>/', ExpenseViewSet.as_view(
        {'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='expense-detail'),
    path('expenses/by-time/', ExpenseViewSet.as_view({'get': 'by_time'}), name='expense-by-time'),
    path('reports/time-period/', TimePeriodReportView.as_view(), name='time-period-report'),
    path('reports/branch-insights/', BranchInsightsView.as_view(), name='branch-insights'),
    path('reports/full-accounting/', FullAccountingView.as_view(), name='full-accounting-report'),
]
