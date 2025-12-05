import os
import django
from rest_framework.test import APIRequestFactory
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from orders.serializers import OrderCreateSerializer
from branches.models import Branch

User = get_user_model()

def verify_fix():
    # Ensure we have a user and a branch
    user, created = User.objects.get_or_create(email='test@example.com', defaults={'username': 'testuser', 'password': 'password'})
    branch, created = Branch.objects.get_or_create(name='Test Branch', defaults={'address': 'Test Address', 'phone_number': '1234567890'})

    # Mock request
    factory = APIRequestFactory()
    request = factory.post('/orders/')
    request.user = user

    data = {
        'services': [
            {
                'service_type': 'Wash',
                'material': 'Cotton',
                'quantity': 2,
                'pricing_type': 'individual',
                'price_per_unit': 10.0,
                'total_price': 20.0
            }
        ],
        'branch': branch.id,
        'pickup_date': '2023-10-27',
        'pickup_time': '10:00:00',
        'pickup_address': '123 Pickup St',
        'pickup_map_link': 'http://maps.google.com',
        'delivery_date': '2023-10-28',
        'delivery_time': '18:00:00',
        'delivery_address': '456 Delivery Ave',
        'delivery_map_link': 'http://maps.google.com',
        'total_amount': 20.0,
        'payment_method': 'cash'
    }

    serializer = OrderCreateSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        try:
            order = serializer.save()
            print(f"SUCCESS: Order created with ID: {order.order_id}")
            # Clean up
            order.delete()
        except TypeError as e:
            print(f"FAILURE: TypeError occurred: {e}")
        except Exception as e:
            print(f"FAILURE: Unexpected error: {e}")
    else:
        print(f"FAILURE: Serializer errors: {serializer.errors}")

if __name__ == '__main__':
    verify_fix()
