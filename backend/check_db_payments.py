import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from payments.models import Payment

User = get_user_model()

print("=== User Payment Diagnostics ===")
users = User.objects.all()
for user in users:
    payment_count = Payment.objects.filter(user=user).count()
    print(f"User: {user.email} (ID: {user.id}) - Payments: {payment_count}")
    
    if payment_count > 0:
        last_payment = Payment.objects.filter(user=user).last()
        print(f"  Last Payment: {last_payment.transaction_uuid} ({last_payment.status}) - Rs. {last_payment.total_amount}")

print("\n=== Total Payments in System ===")
print(f"Total: {Payment.objects.count()}")

print("\n=== Recent Payments (Last 5) ===")
for p in Payment.objects.order_by('-created_at')[:5]:
    print(f"ID: {p.id} | UUID: {p.transaction_uuid} | User: {p.user.email} | Status: {p.status} | Amount: {p.total_amount}")
