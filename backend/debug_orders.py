import os
import django
from django.db.models import Count, Min, Max
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from orders.models import Order
from users.models import User

# Simulate View Logic
print("\n--- SIMULATING ORDER_STATS_VIEW ---")
try:
    from orders.models import Order
    from django.db.models import Sum, Count, Q
    from django.db.models.functions import TruncDay
    from django.utils import timezone
    import datetime

    # Mock user and request
    user = User.objects.get(email='sadhana.develops@gmail.com')
    print(f"Simulating for user: {user.email}")
    
    orders = Order.objects.all()
    
    now = timezone.now()
    start_date = now - datetime.timedelta(days=7)
    range_orders = orders.filter(order_date__gte=start_date)
    
    # 1. Chart Data
    chart_data_raw = range_orders.annotate(
        period=TruncDay('order_date')
    ).values('period').annotate(
        orders=Count('order_id'),
        income=Sum('total_amount', filter=Q(payment_status='paid')),
    ).order_by('period')
    
    print(f"Chart Data Len: {len(list(chart_data_raw))}")
    
    # 2. Stats Cards
    range_stats = range_orders.aggregate(
        total_orders=Count('order_id'),
        total_income=Sum('total_amount', filter=Q(payment_status='paid')),
    )
    
    print(f"Range Stats: {range_stats}")
    
    # 3. Active Orders
    active_orders_count = orders.filter(
        status__in=[
            'dropped by user', 'pending pickup', 'picked up', 'sent to wash', 'in wash', 
            'washed', 'picked by client', 'pending delivery', 'pending', 'in progress'
        ]
    ).count()
    
    print(f"Active Orders: {active_orders_count}")
    
except Exception as e:
    import traceback
    print(f"CRASH: {e}")
    traceback.print_exc()

print("\n--- END SIMULATION ---")
