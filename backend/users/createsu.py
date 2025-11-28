#!/usr/bin/env python
# users/createsu.py

import os
import sys
import django

# --- Ensure project root is in sys.path ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# --- Set Django settings module ---
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

# --- Setup Django ---
django.setup()

from django.conf import settings
from django.contrib.auth import get_user_model

def create_superuser():
    User = get_user_model()

    # Get superuser data from settings (which reads from env)
    admin_email = getattr(settings, "DJANGO_SUPERUSER_EMAIL")
    admin_password = getattr(settings, "DJANGO_SUPERUSER_PASSWORD")
    admin_first_name = getattr(settings, "DJANGO_SUPERUSER_FIRST_NAME")
    admin_last_name = getattr(settings, "DJANGO_SUPERUSER_LAST_NAME")
    admin_phone = getattr(settings, "DJANGO_SUPERUSER_PHONE")  # optional

    if not admin_email or not admin_password:
        raise ValueError("Superuser email and password must be set in environment variables!")

    if not User.objects.filter(email=admin_email).exists():
        User.objects.create_superuser(
            email=admin_email,
            first_name=admin_first_name,
            last_name=admin_last_name,
            phone=admin_phone,
            password=admin_password
        )
        print("Superuser created successfully!")
    else:
        print("Superuser already exists.")

if __name__ == "__main__":
    create_superuser()
