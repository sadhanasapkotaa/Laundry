"""Quick script to delete a user by email."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User

email = "mandeyra7@gmail.com"

try:
    user = User.objects.get(email=email)
    user.delete()
    print(f"✅ Successfully deleted user: {email}")
except User.DoesNotExist:
    print(f"❌ User with email {email} does not exist")
