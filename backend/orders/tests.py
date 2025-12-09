from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClientfrom rest_framework import status
from django.contrib.auth import get_user_model
from branches.models import Branch
from .models import Order

User = get_user_model()

class OrderCreateTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpassword',
            first_name='Test',
            last_name='User',
            phone='9841234567'
        )
        self.client.force_authenticate(user=self.user)
        
        self.branch = Branch.objects.create(
            name='Test Branch',
            branch_id='TEST001',
            city='Kathmandu',
            address='Test Address',
            phone='012345678',
            opening_date='2023-01-01'
        )
        
        self.valid_payload = {
            'branch': self.branch.id,
            'services': [
                {
                    'service_type': 'Shirt',
                    'material': 'Cotton',
                    'quantity': 2,
                    'pricing_type': 'individual',
                    'price_per_unit': 100.00,
                    'total_price': 200.00
                }
            ],
            'pickup_enabled': False,
            'delivery_enabled': False,
            'is_urgent': False,
            'total_amount': 200.00,
            'payment_method': 'cash',
            'payment_status': 'pending',
            'description': 'Test Order'
        }

    def test_create_order(self):
        url = reverse('order-create')
        response = self.client.post(url, self.valid_payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)
        order = Order.objects.first()
        self.assertEqual(order.customer_name, self.user)
        self.assertEqual(order.branch, self.branch)
        self.assertEqual(order.total_amount, 200.00)
        self.assertEqual(order.order_items.count(), 1)

    def test_update_order_status(self):
        # First create an order
        order = Order.objects.create(
            customer_name=self.user,
            branch=self.branch,
            total_amount=100.00,
            status='pending'
        )
        
        url = reverse('order-update', kwargs={'pk': order.order_id})
        payload = {'status': 'completed'}
        response = self.client.patch(url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'completed')
