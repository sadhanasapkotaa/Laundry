import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from branches.models import Branch, BranchManager
from branches.serializers import BranchSerializer

print("--- DEBUGGING BRANCHES ---")

branches = Branch.objects.all()
print(f"Total Branches: {branches.count()}")

for b in branches:
    print(f"\nBranch: {b.name} ({b.branch_id})")
    print(f"  Manager Field: {b.branch_manager}")
    print(f"  Status: {b.status}")
    print(f"  City: {b.city}")
    
    # Check serializer output
    serializer = BranchSerializer(b)
    print(f"  Serialized: {serializer.data}")

print("\n--- END DEBUG ---")
