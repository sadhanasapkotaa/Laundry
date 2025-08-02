"""Views for managing branches and branch managers in the laundry management system."""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Branch, BranchManager
from .serializers import BranchSerializer, BranchManagerSerializer

# Branch Views
class BranchListView(generics.ListAPIView):
    """View to list all branches."""
    # pylint: disable=no-member
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]  # customize as needed

class BranchCreateView(generics.CreateAPIView):
    """View to create a new branch."""
    # pylint: disable=no-member
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]  # customize as needed

class BranchDetailView(generics.RetrieveAPIView):
    """View to retrieve details of a specific branch."""
    # pylint: disable=no-member
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]  # customize as needed

class BranchUpdateView(generics.UpdateAPIView):
    """View to update a specific branch."""
    # pylint: disable=no-member
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]  # customize as needed

class BranchDeleteView(generics.DestroyAPIView):
    """View to delete a specific branch."""
    # pylint: disable=no-member
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]  # customize as needed

# BranchManager Views
class BranchManagerListView(generics.ListAPIView):
    """View to list all branch managers."""
    # pylint: disable=no-member
    queryset = BranchManager.objects.all()
    serializer_class = BranchManagerSerializer
    permission_classes = [IsAuthenticated]

class BranchManagerCreateView(generics.CreateAPIView):
    """View to create a new branch manager."""
    # pylint: disable=no-member
    queryset = BranchManager.objects.all()
    serializer_class = BranchManagerSerializer
    permission_classes = [IsAuthenticated]

class BranchManagerDetailView(generics.RetrieveAPIView):
    """View to retrieve details of a specific branch manager."""
    # pylint: disable=no-member
    queryset = BranchManager.objects.all()
    serializer_class = BranchManagerSerializer
    permission_classes = [IsAuthenticated]

class BranchManagerUpdateView(generics.UpdateAPIView):
    """View to update a specific branch manager."""
    # pylint: disable=no-member
    queryset = BranchManager.objects.all()
    serializer_class = BranchManagerSerializer
    permission_classes = [IsAuthenticated]

class BranchManagerDeleteView(generics.DestroyAPIView):
    """View to delete a specific branch manager."""
    # pylint: disable=no-member
    queryset = BranchManager.objects.all()
    serializer_class = BranchManagerSerializer
    permission_classes = [IsAuthenticated]
