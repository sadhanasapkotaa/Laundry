"""
Populate the database with sample wash types, cloth names, cloth types, and pricing rules.
Run this script to set up initial service data:
python manage.py shell < populate_services.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from services.models import WashType, ClothName, ClothType, PricingRule, SystemSettings

# Create system settings if not exists
settings, created = SystemSettings.objects.get_or_create(
    pk=1,
    defaults={
        'pickup_cost': 200.00,
        'delivery_cost': 200.00,
        'urgent_cost': 500.00
    }
)
if created:
    print("✓ System settings created")
else:
    print("✓ System settings already exist")

# Create Wash Types
wash_types_data = [
    {'name': 'Dry Wash', 'description': 'Professional dry cleaning'},
    {'name': 'Normal Wash', 'description': 'Standard machine wash'},
    {'name': 'Hand Wash', 'description': 'Delicate hand washing'},
    {'name': 'Steam Wash', 'description': 'Steam cleaning for deep cleaning'},
]

wash_types = {}
for data in wash_types_data:
    wt, created = WashType.objects.get_or_create(
        name=data['name'],
        defaults={'description': data['description'], 'is_active': True}
    )
    wash_types[data['name']] = wt
    print(f"{'✓ Created' if created else '✓ Found'} Wash Type: {wt.name}")

# Create Cloth Names
cloth_names_data = [
    {'name': 'Saree', 'description': 'Traditional Indian garment'},
    {'name': 'Shirt', 'description': 'Casual or formal shirt'},
    {'name': 'Pant', 'description': 'Trousers or pants'},
    {'name': 'Coat', 'description': 'Jacket or coat'},
    {'name': 'Blouse', 'description': 'Women\'s blouse'},
    {'name': 'Blanket', 'description': 'Bed blanket'},
    {'name': 'Jacket', 'description': 'Light jacket'},
    {'name': 'Suit', 'description': 'Formal suit'},
]

cloth_names = {}
for data in cloth_names_data:
    cn, created = ClothName.objects.get_or_create(
        name=data['name'],
        defaults={'description': data['description'], 'is_active': True}
    )
    cloth_names[data['name']] = cn
    print(f"{'✓ Created' if created else '✓ Found'} Cloth Name: {cn.name}")

# Create Cloth Types (Materials)
cloth_types_data = [
    {'name': 'Siphon', 'description': 'Lightweight synthetic fabric'},
    {'name': 'Net', 'description': 'Mesh-like fabric'},
    {'name': 'Cotton', 'description': 'Natural cotton fabric'},
    {'name': 'Silk', 'description': 'Luxury silk fabric'},
    {'name': 'Wool', 'description': 'Warm woolen fabric'},
    {'name': 'Leather', 'description': 'Genuine leather'},
    {'name': 'Down', 'description': 'Down-filled material'},
    {'name': 'Khaki', 'description': 'Durable khaki fabric'},
]

cloth_types = {}
for data in cloth_types_data:
    ct, created = ClothType.objects.get_or_create(
        name=data['name'],
        defaults={'description': data['description'], 'is_active': True}
    )
    cloth_types[data['name']] = ct
    print(f"{'✓ Created' if created else '✓ Found'} Cloth Type: {ct.name}")

# Create Pricing Rules
# Format: (wash_type_name, cloth_name_name, cloth_type_name, price)
pricing_rules_data = [
    # Saree combinations
    ('Dry Wash', 'Saree', 'Siphon', 250.00),
    ('Dry Wash', 'Saree', 'Silk', 350.00),
    ('Normal Wash', 'Saree', 'Siphon', 200.00),
    ('Normal Wash', 'Saree', 'Net', 220.00),
    ('Hand Wash', 'Saree', 'Silk', 300.00),
    
    # Shirt combinations
    ('Normal Wash', 'Shirt', 'Cotton', 100.00),
    ('Dry Wash', 'Shirt', 'Silk', 180.00),
    ('Normal Wash', 'Shirt', 'Silk', 150.00),
    
    # Pant combinations
    ('Normal Wash', 'Pant', 'Cotton', 120.00),
    ('Dry Wash', 'Pant', 'Wool', 200.00),
    ('Normal Wash', 'Pant', 'Khaki', 130.00),
    
    # Coat combinations
    ('Dry Wash', 'Coat', 'Wool', 300.00),
    ('Dry Wash', 'Coat', 'Leather', 500.00),
    
    # Blouse combinations
    ('Normal Wash', 'Blouse', 'Cotton', 80.00),
    ('Dry Wash', 'Blouse', 'Silk', 150.00),
    ('Hand Wash', 'Blouse', 'Silk', 120.00),
    
    # Blanket combinations
    ('Normal Wash', 'Blanket', 'Cotton', 400.00),
    ('Dry Wash', 'Blanket', 'Wool', 550.00),
    
    # Jacket combinations
    ('Dry Wash', 'Jacket', 'Down', 600.00),
    ('Dry Wash', 'Jacket', 'Leather', 700.00),
    
    # Suit combinations
    ('Dry Wash', 'Suit', 'Wool', 400.00),
    ('Dry Wash', 'Suit', 'Cotton', 300.00),
]

print("\nCreating Pricing Rules...")
for wash_name, cloth_name, cloth_type_name, price in pricing_rules_data:
    try:
        wash_type = wash_types[wash_name]
        cloth_name_obj = cloth_names[cloth_name]
        cloth_type_obj = cloth_types[cloth_type_name]
        
        pr, created = PricingRule.objects.get_or_create(
            wash_type=wash_type,
            cloth_name=cloth_name_obj,
            cloth_type=cloth_type_obj,
            defaults={'price': price, 'is_active': True}
        )
        
        # Update price if rule already exists but price changed
        if not created and pr.price != price:
            pr.price = price
            pr.save()
            print(f"✓ Updated Pricing Rule: {wash_name} + {cloth_name} + {cloth_type_name} = ₨{price}")
        else:
            print(f"{'✓ Created' if created else '✓ Found'} Pricing Rule: {wash_name} + {cloth_name} + {cloth_type_name} = ₨{price}")
    except Exception as e:
        print(f"✗ Error creating pricing rule for {wash_name} + {cloth_name} + {cloth_type_name}: {e}")

print("\n" + "="*50)
print("Database population complete!")
print("="*50)
print(f"Wash Types: {WashType.objects.count()}")
print(f"Cloth Names: {ClothName.objects.count()}")
print(f"Cloth Types: {ClothType.objects.count()}")
print(f"Pricing Rules: {PricingRule.objects.count()}")
print("="*50)
