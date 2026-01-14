"""URLs for the Branch and BranchManager models in the backend application."""
from django.urls import path
from .views import (
    BranchListView, BranchCreateView, BranchDetailView, BranchUpdateView, BranchDeleteView,
    BranchStatsView, BranchManagerListView, BranchManagerCreateView, BranchManagerDetailView, 
    BranchManagerUpdateView, BranchManagerDeleteView, BranchOverallPerformanceView,
    BranchPerformanceView, BranchExpenseBreakdownView
)

urlpatterns = [
    # Branch URLs
    path('branches/', BranchListView.as_view(), name='branch-list'),
    path('branches/performance/overall/', BranchOverallPerformanceView.as_view(), name='branch-overall-performance'),
    path('branches/create/', BranchCreateView.as_view(), name='branch-create'),
    path('branches/<int:pk>/', BranchDetailView.as_view(), name='branch-detail'),
    path('branches/<int:pk>/stats/', BranchStatsView.as_view(), name='branch-stats'),
    path('branches/<int:pk>/performance/', BranchPerformanceView.as_view(), name='branch-performance'),
    path('branches/<int:pk>/expenses/breakdown/', BranchExpenseBreakdownView.as_view(), name='branch-expense-breakdown'),
    path('branches/<int:pk>/update/', BranchUpdateView.as_view(), name='branch-update'),
    path('branches/<int:pk>/delete/', BranchDeleteView.as_view(), name='branch-delete'),

    # BranchManager URLs
    path('branch-managers/', BranchManagerListView.as_view(), name='branch-manager-list'),
    path('branch-managers/create/', BranchManagerCreateView.as_view(), name='branch-manager-create'),
    path('branch-managers/<int:pk>/', BranchManagerDetailView.as_view(), name='branch-manager-detail'),
    path('branch-managers/<int:pk>/update/', BranchManagerUpdateView.as_view(), name='branch-manager-update'),
    path('branch-managers/<int:pk>/delete/', BranchManagerDeleteView.as_view(), name='branch-manager-delete'),
]
