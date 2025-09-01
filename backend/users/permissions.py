"""Permissions for user roles in the application."""
from django.contrib.auth import get_user_model
from rest_framework.permissions import BasePermission
from .models import Role

User = get_user_model()

class IsAdmin(BasePermission):
    """Permission for admin users only"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.ADMIN

class IsBranchManager(BasePermission):
    """Permission for branch managers"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.BRANCH_MANAGER

    def has_object_permission(self, request, view, obj):
        """Ensure branch managers can only access their own branch data"""
        if hasattr(obj, 'branch'):
            return obj.branch == request.user.branchmanager.branch
        return False

class IsRider(BasePermission):
    """Permission for riders"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.RIDER

    def has_object_permission(self, request, view, obj):
        """Ensure riders can only access their assigned pickups/deliveries"""
        if hasattr(obj, 'rider'):
            return obj.rider == request.user
        return False

class IsCustomer(BasePermission):
    """Permission for customers"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.CUSTOMER

    def has_object_permission(self, request, view, obj):
        """Ensure customers can only access their own data"""
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        return False

class IsAdminOrBranchManager(BasePermission):
    """Permission for admin or branch manager"""
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.role in [Role.ADMIN, Role.BRANCH_MANAGER])

    def has_object_permission(self, request, view, obj):
        if request.user.role == Role.ADMIN:
            return True
        if request.user.role == Role.BRANCH_MANAGER:
            if hasattr(obj, 'branch'):
                return obj.branch == request.user.branchmanager.branch
        return False

class IsBranchOwnerOrAdmin(BasePermission):
    """Check if user owns the branch or is admin"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == Role.ADMIN:
            return True
        if request.user.role == Role.BRANCH_MANAGER:
            return ( hasattr(request.user, 'branchmanager')
                    and request.user.branchmanager.branch == obj )
        return False

class CanManageOrders(BasePermission):
    """Permission for managing orders"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            Role.ADMIN, Role.BRANCH_MANAGER
        ]

    def has_object_permission(self, request, view, obj):
        if request.user.role == Role.ADMIN:
            return True
        if request.user.role == Role.BRANCH_MANAGER:
            return obj.branch == request.user.branchmanager.branch
        return False

class CanManagePickups(BasePermission):
    """Permission for managing pickups"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            Role.ADMIN, Role.BRANCH_MANAGER, Role.RIDER
        ]

    def has_object_permission(self, request, view, obj):
        if request.user.role == Role.ADMIN:
            return True
        if request.user.role == Role.BRANCH_MANAGER:
            return obj.branch == request.user.branchmanager.branch
        if request.user.role == Role.RIDER:
            return obj.rider == request.user
        return False

class CanManagePayments(BasePermission):
    """Permission for managing payments"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            Role.ADMIN, Role.BRANCH_MANAGER
        ]

    def has_object_permission(self, request, view, obj):
        if request.user.role == Role.ADMIN:
            return True
        if request.user.role == Role.BRANCH_MANAGER:
            if hasattr(obj, 'order'):
                return obj.order.branch == request.user.branchmanager.branch
            if hasattr(obj, 'branch'):
                return obj.branch == request.user.branchmanager.branch
        return False

class CanViewAccounting(BasePermission):
    """Permission for viewing accounting information"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.ADMIN
