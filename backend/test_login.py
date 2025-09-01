import requests
import json

# Test login endpoint
url = 'http://localhost:8000/api/auth/login/'
data = {
    'email': 'admin@admin.com',
    'password': 'admin123'
}

print("Testing login endpoint...")
print(f"URL: {url}")
print(f"Data: {data}")

try:
    response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        print("SUCCESS!")
        print(f"Response: {response.json()}")
    else:
        print("FAILED!")
        try:
            print(f"Error Response: {response.json()}")
        except:
            print(f"Raw Response: {response.text}")
            
except Exception as e:
    print(f"Request failed: {e}")
