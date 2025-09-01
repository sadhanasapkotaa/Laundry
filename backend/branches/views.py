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

    def perform_create(self, serializer):
        """Override to create user along with branch manager."""
        # Extract user data from the request
        user_data = {
            'email': self.request.data.get('email'),
            'password': self.request.data.get('password'),
            'first_name': self.request.data.get('first_name'),
            'last_name': self.request.data.get('last_name'),
            'phone': self.request.data.get('phone'),
            'role': 'branch_manager'
        }
        
        # Create the user first
        from users.models import User
        from django.contrib.auth.hashers import make_password
        
        user = User.objects.create(
            email=user_data['email'],
            password=make_password(user_data['password']),
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            phone=user_data.get('phone', ''),
            role='branch_manager',
            is_verified=True  # Auto-verify for admin-created accounts
        )
        
        # Create the branch manager with the user
        serializer.save(user=user)

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
