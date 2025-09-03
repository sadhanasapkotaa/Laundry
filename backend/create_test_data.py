#!/usr/bin/env python
"""
Script to check and create test data for branches and expense categories.
Run this from the Django backend directory.
"""

import os
import sys
import django
from datetime import date

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from branches.models import Branch
from accounting.models import ExpenseCategory, IncomeCategory

def create_test_data():
    """Create test branches and categories if they don't exist."""
    print("Checking existing data...")
    
    # Check branches
    branches = Branch.objects.all()
    print(f"Found {branches.count()} branches:")
    for branch in branches:
        print(f"  - {branch.name} ({branch.branch_id}) - Status: {branch.status}")
    
    # Check expense categories
    expense_categories = ExpenseCategory.objects.all()
    print(f"\nFound {expense_categories.count()} expense categories:")
    for category in expense_categories:
        print(f"  - {category.name}")
    
    # Create test branches if none exist
    if branches.count() == 0:
        print("\nCreating test branches...")
        test_branches = [
            {
                'name': 'Main Branch',
                'address': '123 Main Street',
                'city': 'Kathmandu',
                'phone': '+977-1-4567890',
                'email': 'main@laundry.com',
                'status': 'active',
                'opening_date': date(2024, 1, 1),
                'branch_manager': 'John Doe'
            },
            {
                'name': 'Thamel Branch',
                'address': '456 Thamel Road',
                'city': 'Kathmandu',
                'phone': '+977-1-4567891',
                'email': 'thamel@laundry.com',
                'status': 'active',
                'opening_date': date(2024, 2, 1),
                'branch_manager': 'Jane Smith'
            },
            {
                'name': 'Pokhara Branch',
                'address': '789 Lakeside',
                'city': 'Pokhara',
                'phone': '+977-61-567890',
                'email': 'pokhara@laundry.com',
                'status': 'active',
                'opening_date': date(2024, 3, 1),
                'branch_manager': 'Ram Sharma'
            }
        ]
        
        for branch_data in test_branches:
            branch = Branch.objects.create(**branch_data)
            print(f"  Created: {branch.name} ({branch.branch_id})")
    
    # Create test expense categories if none exist
    if expense_categories.count() == 0:
        print("\nCreating test expense categories...")
        test_categories = [
            'Utilities',
            'Supplies',
            'Equipment Maintenance',
            'Staff Salary',
            'Rent',
            'Marketing',
            'Transportation',
            'Office Supplies',
            'Chemicals',
            'Equipment Purchase'
        ]
        
        for category_name in test_categories:
            category = ExpenseCategory.objects.create(name=category_name)
            print(f"  Created: {category.name}")
    
    # Create test income categories if none exist
    income_categories = IncomeCategory.objects.all()
    if income_categories.count() == 0:
        print("\nCreating test income categories...")
        test_income_categories = [
            'Laundry Service',
            'Dry Cleaning',
            'Ironing Service',
            'Express Service',
            'Pickup & Delivery',
            'Stain Removal',
            'Alteration Service'
        ]
        
        for category_name in test_income_categories:
            category = IncomeCategory.objects.create(name=category_name)
            print(f"  Created: {category.name}")
    
    print("\nTest data creation complete!")
    print(f"Total branches: {Branch.objects.count()}")
    print(f"Total expense categories: {ExpenseCategory.objects.count()}")
    print(f"Total income categories: {IncomeCategory.objects.count()}")

if __name__ == "__main__":
    create_test_data()
