#!/usr/bin/env python
"""
Simple test script to verify accounting API endpoints are working.
Run this after starting the Django server with: python manage.py runserver
"""

import requests
import json
from datetime import date

# API base URL
API_BASE = "http://localhost:8000/api"

def test_api_endpoint(url, method='GET', data=None):
    """Test an API endpoint and return the response."""
    try:
        if method == 'GET':
            response = requests.get(url)
        elif method == 'POST':
            response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        elif method == 'PUT':
            response = requests.put(url, json=data, headers={'Content-Type': 'application/json'})
        elif method == 'DELETE':
            response = requests.delete(url)
        
        print(f"\n{method} {url}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code < 300:
            try:
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2)[:500]}...")
                return result
            except (ValueError, json.JSONDecodeError):
                print(f"Response: {response.text[:200]}...")
                return response.text
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def main():
    print("Testing Accounting API Endpoints")
    print("=" * 50)
    
    # Test 1: Get accounting data (branches and categories)
    print("\n1. Testing accounting data endpoint...")
    data = test_api_endpoint(f"{API_BASE}/accounting/data/")
    
    # Test 2: Create an expense category
    print("\n2. Testing expense category creation...")
    category_data = {"name": "Test Category"}
    test_api_endpoint(f"{API_BASE}/accounting/expense-categories/", "POST", category_data)
    
    # Test 3: List expense categories
    print("\n3. Testing expense categories list...")
    test_api_endpoint(f"{API_BASE}/accounting/expense-categories/")
    
    # Test 4: Create an expense (if we have branches and categories)
    print("\n4. Testing expense creation...")
    if data and data.get('branches'):
        branch_id = data['branches'][0]['id'] if data['branches'] else 1
        category_id = 1  # Use a default category ID
        
        expense_data = {
            "branch": branch_id,
            "category": category_id,
            "amount": 100.50,
            "description": "Test expense",
            "date_incurred": str(date.today())
        }
        test_api_endpoint(f"{API_BASE}/accounting/expenses/", "POST", expense_data)
    
    # Test 5: List expenses
    print("\n5. Testing expenses list...")
    test_api_endpoint(f"{API_BASE}/accounting/expenses/")
    
    print("\n" + "=" * 50)
    print("API Testing Complete!")

if __name__ == "__main__":
    main()
