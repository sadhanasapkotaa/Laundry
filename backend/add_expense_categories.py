#!/usr/bin/env python
"""
Script to add more expense categories for better testing.
"""

import os
import sys
import django

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from accounting.models import ExpenseCategory

def add_more_categories():
    """Add more expense categories."""
    additional_categories = [
        'Electricity',
        'Water Bill',
        'Staff Salary',
        'Equipment Maintenance',
        'Rent',
        'Marketing',
        'Transportation',
        'Office Supplies',
        'Detergent',
        'Equipment Purchase'
    ]
    
    created_count = 0
    for category_name in additional_categories:
        if not ExpenseCategory.objects.filter(name=category_name).exists():
            category = ExpenseCategory.objects.create(name=category_name)
            print(f"Created: {category.name}")
            created_count += 1
        else:
            print(f"Already exists: {category_name}")
    
    print(f"\nCreated {created_count} new categories")
    print(f"Total expense categories: {ExpenseCategory.objects.count()}")

if __name__ == "__main__":
    add_more_categories()
