
import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from branches.views import BranchListView, BranchOverallPerformanceView

User = get_user_model()
factory = APIRequestFactory()

print("--- DEBUGGING BRANCH API ---")

# creating test user
try:
    user = User.objects.get(email='admin@example.com')
except User.DoesNotExist:
    # Fallback to first superuser
    user = User.objects.filter(is_superuser=True).first()
    if not user:
        print("No admin user found for testing.")
        sys.exit(1)

print(f"Using user: {user.email}")

# helper function
def test_view(view_class, path, data=None):
    view = view_class.as_view()
    request = factory.get(path, data or {})
    force_authenticate(request, user=user)
    response = view(request)
    print(f"\nEndpoint: {path}")
    print(f"Status: {response.status_code}")
    if hasattr(response, 'data'):
        data = response.data
        if isinstance(data, dict):
            print(f"Keys: {list(data.keys())}")
            if 'results' in data:
                print(f"Pagination 'results' count: {len(data['results'])}")
                if len(data['results']) > 0:
                    print(f"Sample item: {data['results'][0].keys()}")
        elif isinstance(data, list):
             print(f"Is List. Count: {len(data)}")
             if len(data) > 0:
                 print(f"Sample item: {data[0]}")
        else:
            print(f"Type: {type(data)}")
    else:
        print("No data attribute.")

# 1. Test Branch List (Pagination Check)
test_view(BranchListView, '/api/branch/branches/')

# 2. Test Performance View
test_view(BranchOverallPerformanceView, '/api/branch/branches/performance/overall/', {'range': '7d'})
test_view(BranchOverallPerformanceView, '/api/branch/branches/performance/overall/', {'range': 'today'})

print("\n--- END DEBUG ---")
