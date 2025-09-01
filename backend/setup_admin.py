#!/usr/bin/env python
"""
Script to create or update admin user for the laundry system.
Run this script to ensure you have a proper admin user for testing.
"""
from users.models import User, Role
# from django.contrib.auth.hashers import make_password

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()


def create_admin_user():
    """Create or update admin user."""
    email = 'admin@admin.com'
    password = 'admin123'
    try:
        # Try to get existing user
        admin_user = User.objects.get(email=email)
        print(f"Found existing user: {admin_user.email}")
        
        # Update user properties
        admin_user.role = Role.ADMIN
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.is_verified = True
        admin_user.is_active = True
        admin_user.first_name = 'Admin'
        admin_user.last_name = 'User'
        admin_user.phone = '+9779876543210'
        admin_user.set_password(password)
        admin_user.save()
        
        print("✅ Admin user updated successfully!")
    except User.objects.model.DoesNotExist:
        # Create new admin user
        admin_user = User.objects.create_user(
            email=email,
            first_name='Admin',
            last_name='User',
            phone='+9779876543210',
            password=password,
            role=Role.ADMIN,
            is_staff=True,
            is_superuser=True,
            is_verified=True,
            is_active=True
        )
        
        print("✅ Admin user created successfully!")
    
    # Display user info
    print(f"""
Admin User Details:
==================
Email: {admin_user.email}
Role: {admin_user.role}
Name: {admin_user.first_name} {admin_user.last_name}
Phone: {admin_user.phone}
Is Staff: {admin_user.is_staff}
Is Superuser: {admin_user.is_superuser}
Is Verified: {admin_user.is_verified}
Is Active: {admin_user.is_active}

You can now login with:
Email: {email}
Password: {password}
""")

if __name__ == '__main__':
    create_admin_user()
