from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

def role_required(*allowed_roles):
    """Decorator to check user roles"""
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(self, request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response({'error': 'Authentication required'}, 
                              status=status.HTTP_401_UNAUTHORIZED)
            
            if request.user.role not in allowed_roles:
                return Response({'error': 'Insufficient permissions'}, 
                              status=status.HTTP_403_FORBIDDEN)
            
            return view_func(self, request, *args, **kwargs)
        return _wrapped_view
    return decorator

def branch_access_required(view_func):
    """Decorator to check branch access for branch managers"""
    @wraps(view_func)
    def _wrapped_view(self, request, *args, **kwargs):
        if request.user.role == User.Role.ADMIN:
            return view_func(self, request, *args, **kwargs)
        
        if request.user.role == User.Role.BRANCH_MANAGER:
            branch_id = kwargs.get('branch_id') or request.data.get('branch_id')
            if branch_id and hasattr(request.user, 'branchmanager'):
                if str(request.user.branchmanager.branch.id) != str(branch_id):
                    return Response({'error': 'Access denied to this branch'}, 
                                  status=status.HTTP_403_FORBIDDEN)
            
            return view_func(self, request, *args, **kwargs)
        
        return Response({'error': 'Insufficient permissions'}, 
                       status=status.HTTP_403_FORBIDDEN)
    return _wrapped_view
