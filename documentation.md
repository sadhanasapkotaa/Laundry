# Laundry Management System - Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Authentication & Authorization](#authentication--authorization)
7. [User Roles & Permissions](#user-roles--permissions)
8. [Business Logic & Workflows](#business-logic--workflows)
9. [Payment Integration](#payment-integration)
10. [Development Setup](#development-setup)
11. [Deployment Guide](#deployment-guide)
12. [Security Considerations](#security-considerations)

---

## 1. Project Overview

### 1.1 Purpose
The Laundry Management System is a comprehensive web application designed to manage laundry operations across multiple branches. It handles order management, payment processing, delivery tracking, accounting, and branch performance analytics.

### 1.2 Key Features
- **Multi-Branch Management**: Support for multiple laundry branches with independent operations
- **Role-Based Access Control**: Five distinct user roles (Admin, Branch Manager, Rider, Customer, Accountant)
- **Order Management**: Complete order lifecycle from creation to delivery
- **Payment Integration**: eSewa payment gateway integration with cash and bank transfer options
- **Accounting System**: Income and expense tracking per branch
- **Dynamic Pricing**: Configurable pricing based on wash type, cloth type, and material
- **Delivery Tracking**: Real-time delivery status updates for riders
- **VIP Customer System**: Automatic VIP status based on monthly spending (₨50,000+ threshold)
- **Multi-Language Support**: i18n implementation for localization
- **Responsive Design**: Mobile-friendly interface

---

## 2. System Architecture

### 2.1 Architecture Pattern
**Monolithic Backend + SPA Frontend**
- **Backend**: Django REST Framework (API-first architecture)
- **Frontend**: Next.js (React-based SPA)
- **Communication**: RESTful APIs with JWT authentication

### 2.2 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Customer   │  │    Admin     │  │    Branch    │      │
│  │   Portal     │  │   Dashboard  │  │   Manager    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │  REST API     │
                    │  (JWT Auth)   │
                    └───────┬───────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Django)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Users   │  │ Branches │  │  Orders  │  │ Payments │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │Services  │  │Accounting│  │Deliveries│                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │   SQLite DB   │
                    │   (WAL Mode)  │
                    └───────────────┘
```

### 2.3 Data Flow
1. **User Authentication**: JWT tokens issued on login, stored in localStorage
2. **API Requests**: Axios interceptors attach JWT to all requests
3. **Authorization**: Backend validates JWT and checks role-based permissions
4. **Data Filtering**: Queries automatically filtered based on user role and branch
5. **Response**: JSON data returned to frontend for rendering

---

## 3. Technology Stack

### 3.1 Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.x | Programming language |
| Django | 5.2.4 | Web framework |
| Django REST Framework | Latest | API development |
| django-cors-headers | Latest | CORS handling |
| django-filter | Latest | Query filtering |
| djangorestframework-simplejwt | Latest | JWT authentication |
| django-environ | Latest | Environment variable management |

### 3.2 Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework |
| React | 18.x | UI library |
| TypeScript | Latest | Type safety |
| Tailwind CSS | Latest | Styling |
| React Query | Latest | Data fetching |
| Axios | Latest | HTTP client |
| React Icons | Latest | Icon library |
| Recharts | Latest | Data visualization |
| i18next | Latest | Internationalization |

### 3.3 Database
- **SQLite** with WAL (Write-Ahead Logging) mode for better concurrency
- **Timeout**: 30 seconds for concurrent write handling

### 3.4 Third-Party Integrations
- **eSewa**: Payment gateway (UAT environment)
- **Email**: SMTP (Gmail) for notifications

---

## 4. Database Schema

### 4.1 Core Models

#### User Model
```python
class User(AbstractUser):
    email = EmailField(unique=True)  # Primary identifier
    first_name = CharField(max_length=100)
    last_name = CharField(max_length=100)
    phone = CharField(max_length=20)
    role = CharField(choices=Role.choices, default='customer')
    is_verified = BooleanField(default=False)
    is_vip = BooleanField(default=False)
    date_joined = DateTimeField(auto_now_add=True)
```

**Roles**: admin, branch_manager, rider, customer, accountant

#### Branch Model
```python
class Branch:
    name = CharField(max_length=100)
    branch_id = CharField(max_length=10, unique=True)  # Auto: BR-001
    branch_manager = CharField(max_length=100)
    address = CharField(max_length=255)
    city = CharField(max_length=100)
    map_link = URLField(optional)
    phone = CharField(max_length=20)
    email = EmailField()
    status = CharField(choices=['active', 'inactive'])
    opening_date = DateField()
```

**Methods**:
- `get_total_orders()`: Count of orders
- `get_monthly_revenue()`: Current month revenue
- `get_monthly_expenses()`: Current month expenses
- `get_staff_count()`: Active staff count

#### BranchManager Model
```python
class BranchManager:
    manager_id = CharField(unique=True)  # Auto: MGR-0001
    user = OneToOneField(User, primary_key=True)
    branch = ForeignKey(Branch)
    salary = DecimalField(max_digits=10, decimal_places=2)
    hired_date = DateField()
    leaving_date = DateField(optional)
    id_type = CharField(choices=IDType.choices)
    citizenship_number = BigIntegerField()
    is_active = BooleanField(default=True)
```

#### Order Model
```python
class Order:
    order_id = UUIDField(primary_key=True, auto)
    customer_name = ForeignKey(User)
    branch = ForeignKey(Branch)
    pickup_enabled = BooleanField(default=False)
    delivery_enabled = BooleanField(default=False)
    pickup_date = DateTimeField(optional)
    pickup_time = CharField(choices=TIME_SLOTS)
    delivery_date = DateTimeField(optional)
    delivery_time = CharField(choices=TIME_SLOTS)
    status = CharField(choices=ORDER_STATUS)
    total_amount = DecimalField(max_digits=10, decimal_places=2)
    discount = DecimalField(default=0)
    is_urgent = BooleanField(default=False)
    payment_method = CharField(choices=['esewa', 'bank', 'cash'])
    payment_status = CharField(choices=['pending', 'partially_paid', 'paid', 'failed'])
```

**Order Statuses**:
- dropped by user
- pending pickup
- picked up
- sent to wash
- in wash
- washed
- picked by client
- pending delivery
- delivered
- cancelled
- refunded

#### OrderItem Model
```python
class OrderItem:
    order = ForeignKey(Order)
    service_type = CharField(max_length=100)  # e.g., 'saree', 'shirt'
    wash_type = CharField(max_length=100)  # e.g., 'Dry Wash'
    material = CharField(max_length=100)  # e.g., 'cotton', 'silk'
    quantity = PositiveIntegerField()
    pricing_type = CharField(choices=['individual', 'bulk'])
    price_per_unit = DecimalField()
    total_price = DecimalField()
```

#### Payment Model
```python
class Payment:
    transaction_uuid = CharField(unique=True)  # Auto: YYMMDD-HHMMSS-UUID
    user = ForeignKey(User)
    amount = DecimalField()
    tax_amount = DecimalField(default=0)
    total_amount = DecimalField()
    status = CharField(choices=PAYMENT_STATUS)
    payment_type = CharField(choices=['cash', 'bank', 'esewa'])
    transaction_code = CharField(optional)  # eSewa ref
    ref_id = CharField(optional)
    branch = ForeignKey(Branch, optional)
    order_data = JSONField(optional)
    payment_source = CharField(default='payment_page')  # 'order' or 'payment_page'
    idempotency_key = CharField(optional)  # Prevent duplicates
    income_record = OneToOneField(Income, optional)
```

**Payment Statuses**: PENDING, COMPLETE, FAILED, CANCELED, FULL_REFUND, PARTIAL_REFUND, NOT_FOUND

#### OrderPayment Model (Junction Table)
```python
class OrderPayment:
    order = ForeignKey(Order)
    payment = ForeignKey(Payment)
    amount_applied = DecimalField()  # Portion applied to this order
    created_at = DateTimeField(auto_now_add=True)
```

**Purpose**: Enables advance payments and partial payments across multiple orders

#### Delivery Model
```python
class Delivery:
    order = ForeignKey(Order)
    delivery_address = CharField(max_length=255)
    map_link = URLField(optional)
    delivery_contact = CharField(max_length=15)
    delivery_type = CharField(choices=['pickup', 'drop'])
    delivery_person = ForeignKey(User, optional)  # Rider
    delivery_date = DateTimeField(auto_now_add=True)
    delivery_vehicle = CharField(optional)
    status = CharField(choices=['pending', 'in_progress', 'delivered', 'cancelled'])
    delivery_start_time = DateTimeField(optional)
    delivery_end_time = DateTimeField(optional)
    delivery_time = CharField(choices=TIME_SLOTS)
```

#### Accounting Models
```python
class ExpenseCategory:
    name = CharField(max_length=50, unique=True)

class Expense:
    branch = ForeignKey(Branch)
    category = ForeignKey(ExpenseCategory)
    amount = DecimalField()
    description = TextField(optional)
    date_incurred = DateField()

class IncomeCategory:
    name = CharField(max_length=50, unique=True)

class Income:
    branch = ForeignKey(Branch)
    category = ForeignKey(IncomeCategory)
    description = TextField(optional)
    amount = DecimalField()
    date_received = DateField()
```

#### Service Configuration Models
```python
class SystemSettings:  # Singleton
    pickup_cost = DecimalField(default=50)
    delivery_cost = DecimalField(default=50)
    urgent_fee = DecimalField(default=100)

class WashType:
    name = CharField(unique=True)  # e.g., "Dry Wash", "Machine Wash"
    is_active = BooleanField(default=True)

class ClothName:
    name = CharField(unique=True)  # e.g., "Saree", "Suit"
    is_active = BooleanField(default=True)

class ClothType:
    name = CharField(unique=True)  # e.g., "Cotton", "Silk"
    is_active = BooleanField(default=True)

class PricingRule:
    wash_type = ForeignKey(WashType)
    cloth_name = ForeignKey(ClothName)
    cloth_type = ForeignKey(ClothType)
    price = DecimalField()
    is_active = BooleanField(default=True)
    
    # Unique constraint on (wash_type, cloth_name, cloth_type)
```

### 4.2 Database Relationships

```
User ──1:1── BranchManager ──M:1── Branch
User ──1:M── Order ──M:1── Branch
Order ──1:M── OrderItem
Order ──1:M── Delivery ──M:1── User (Rider)
Order ──M:M── Payment (via OrderPayment)
Payment ──1:1── Income
Branch ──1:M── Expense
Branch ──1:M── Income
```

### 4.3 Auto-Generated Fields
- **Branch ID**: `BR-001`, `BR-002`, etc.
- **Manager ID**: `MGR-0001`, `MGR-0002`, etc.
- **Transaction UUID**: `YYMMDD-HHMMSS-{8-char-uuid}`
- **Order ID**: UUID4

---

## 5. API Documentation

### 5.1 Base URL
- **Development**: `http://localhost:8000/api`
- **Production**: `https://your-domain.com/api`

### 5.2 Authentication Endpoints

#### POST `/users/register/`
Register a new customer account.

**Request**:
```json
{
  "email": "customer@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "9841234567"
}
```

**Response** (201):
```json
{
  "message": "User created successfully. Please verify your email.",
  "user": {
    "id": 1,
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "customer"
  }
}
```

#### POST `/users/login/`
Authenticate and receive JWT tokens.

**Request**:
```json
{
  "email": "customer@example.com",
  "password": "securepassword"
}
```

**Response** (200):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "customer",
    "is_vip": false
  }
}
```

#### POST `/users/token/refresh/`
Refresh access token.

**Request**:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response** (200):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 5.3 Branch Endpoints

#### GET `/branch/branches/`
List all branches (filtered by role).

**Query Parameters**:
- `search`: Search by name, branch_id, address, city, manager
- `status`: Filter by status (active/inactive)
- `city`: Filter by city
- `ordering`: Sort field (e.g., `-created`, `name`)

**Response** (200):
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Main Branch",
      "branch_id": "BR-001",
      "address": "Kathmandu, Nepal",
      "city": "Kathmandu",
      "phone": "01-4567890",
      "email": "main@laundry.com",
      "branch_manager": "John Manager",
      "status": "active",
      "opening_date": "2024-01-01",
      "total_orders": 150,
      "monthly_revenue": 50000.00,
      "monthly_expenses": 30000.00,
      "staff_count": 5
    }
  ]
}
```

**Authorization**:
- Admin: Sees all branches
- Branch Manager: Sees only their assigned branch
- Others: Sees all branches (read-only)

#### GET `/branch/branches/{id}/`
Get branch details.

**Response** (200): Same as list item

#### POST `/branch/branches/create/`
Create a new branch (Admin only).

**Request**:
```json
{
  "name": "New Branch",
  "address": "Pokhara, Nepal",
  "city": "Pokhara",
  "phone": "061-123456",
  "email": "pokhara@laundry.com",
  "branch_manager": "Jane Manager",
  "status": "active",
  "opening_date": "2024-06-01"
}
```

#### GET `/branch/branches/performance/overall/?range=7d`
Get overall performance across branches.

**Query Parameters**:
- `range`: `today`, `7d`, `1m`, `1y`

**Response** (200):
```json
[
  {
    "date": "2024-01-01",
    "revenue": 15000.00,
    "expenses": 8000.00,
    "profit": 7000.00
  }
]
```

**Authorization**: Filtered by branch for Branch Managers

### 5.4 Order Endpoints

#### GET `/orders/orders/`
List all orders (filtered by role).

**Query Parameters**:
- `ordering`: Sort field (default: `-created`)

**Response** (200):
```json
[
  {
    "order_id": "123e4567-e89b-12d3-a456-426614174000",
    "customer_name": "John Doe",
    "branch": 1,
    "branch_name": "Main Branch",
    "status": "in wash",
    "payment_status": "paid",
    "payment_method": "esewa",
    "total_amount": 500.00,
    "discount": 0.00,
    "is_urgent": false,
    "pickup_enabled": true,
    "delivery_enabled": true,
    "pickup_date": "2024-01-15T10:00:00Z",
    "delivery_date": "2024-01-17T16:00:00Z",
    "created": "2024-01-14T08:30:00Z",
    "services": [
      {
        "service_type": "Saree",
        "wash_type": "Dry Wash",
        "material": "Silk",
        "quantity": 2,
        "price_per_unit": 250.00,
        "total_price": 500.00
      }
    ]
  }
]
```

**Authorization**:
- Admin: All orders
- Branch Manager: Only their branch's orders
- Customer: Only their own orders

#### POST `/orders/orders/create/`
Create a new order.

**Request**:
```json
{
  "branch": 1,
  "services": [
    {
      "service_type": "Saree",
      "material": "Silk",
      "quantity": 2,
      "pricing_type": "individual",
      "price_per_unit": 250.00,
      "total_price": 500.00,
      "wash_type": "Dry Wash"
    }
  ],
  "pickup_enabled": true,
  "delivery_enabled": true,
  "pickup_date": "2024-01-15",
  "pickup_time": "late_morning",
  "delivery_date": "2024-01-17",
  "delivery_time": "late_afternoon",
  "is_urgent": false,
  "total_amount": 500.00,
  "payment_method": "esewa",
  "payment_status": "pending",
  "description": "Handle with care"
}
```

**Response** (201): Order object with auto-assigned rider

#### PATCH `/orders/orders/{id}/update/`
Update order status or payment status.

**Request**:
```json
{
  "status": "delivered",
  "payment_status": "paid"
}
```

#### GET `/orders/stats/?range=7d`
Get order statistics.

**Query Parameters**:
- `range`: `7d`, `1m`, `1y`

**Response** (200):
```json
{
  "success": true,
  "time_range": "7d",
  "stats": {
    "total_orders": 45,
    "total_income": 22500.00,
    "active_orders": 12
  },
  "chart_data": [...],
  "service_distribution": [...],
  "branch_performance": [...],
  "recent_activity": [...]
}
```

**Authorization**: Filtered by branch for Branch Managers

### 5.5 Payment Endpoints

#### POST `/payments/initiate/`
Initiate a payment.

**Request**:
```json
{
  "payment_type": "esewa",
  "amount": 500.00,
  "order_id": "123e4567-e89b-12d3-a456-426614174000",
  "branch_id": 1
}
```

**Response** (200) for eSewa:
```json
{
  "success": true,
  "payment_data": {
    "amount": "500",
    "tax_amount": "0",
    "total_amount": "500",
    "transaction_uuid": "240115-143000-abc12345",
    "product_code": "EPAYTEST",
    "product_service_charge": "0",
    "product_delivery_charge": "0",
    "success_url": "http://localhost:3000/payment/success",
    "failure_url": "http://localhost:3000/payment/failure",
    "signed_field_names": "...",
    "signature": "..."
  },
  "esewa_url": "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
}
```

#### POST `/payments/verify/`
Verify eSewa payment callback.

**Request**:
```json
{
  "data": "base64_encoded_esewa_response"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "payment": {
    "transaction_uuid": "240115-143000-abc12345",
    "status": "COMPLETE",
    "total_amount": 500.00
  }
}
```

#### GET `/payments/user-payments/`
Get user's payment history.

**Response** (200):
```json
[
  {
    "transaction_uuid": "240115-143000-abc12345",
    "total_amount": 500.00,
    "status": "COMPLETE",
    "payment_type": "esewa",
    "created_at": "2024-01-15T14:30:00Z",
    "branch": "Main Branch",
    "payment_source": "order"
  }
]
```

### 5.6 Service Configuration Endpoints

#### GET `/services/settings/`
Get system settings (public).

**Response** (200):
```json
{
  "pickup_cost": 50.00,
  "delivery_cost": 50.00,
  "urgent_fee": 100.00
}
```

#### PUT `/services/settings/`
Update system settings (Admin only).

#### GET `/services/pricing-rules/`
List all pricing rules.

**Response** (200):
```json
[
  {
    "id": 1,
    "wash_type": "Dry Wash",
    "cloth_name": "Saree",
    "cloth_type": "Silk",
    "price": 250.00,
    "is_active": true
  }
]
```

#### GET `/services/pricing-rules/lookup/?wash_type=1&cloth_name=2&cloth_type=3`
Look up price for specific combination.

**Response** (200):
```json
{
  "price": "250.00"
}
```

### 5.7 Delivery Endpoints

#### GET `/orders/deliveries/`
List deliveries.

**Response** (200):
```json
[
  {
    "id": 1,
    "order": "123e4567-e89b-12d3-a456-426614174000",
    "delivery_type": "pickup",
    "delivery_address": "Kathmandu, Nepal",
    "delivery_person": "Rider Name",
    "status": "in_progress",
    "delivery_time": "late_morning"
  }
]
```

**Authorization**:
- Rider: Only their assigned deliveries
- Others: All deliveries

#### PATCH `/orders/deliveries/{id}/update/`
Update delivery status (Rider).

**Request**:
```json
{
  "status": "delivered"
}
```

**Side Effects**:
- If pickup delivery → Order status becomes "picked up"
- If drop delivery → Order status becomes "delivered"

### 5.8 User Management Endpoints

#### POST `/auth/register/`
Register a new user (documented in 5.2).

#### POST `/auth/verify/`
Verify email with OTP code.

**Request**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### GET `/auth/profile/`
Get current user profile (requires authentication).

**Response** (200):
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "9841234567",
  "role": "customer",
  "is_verified": true,
  "is_vip": false,
  "date_joined": "2024-01-01T00:00:00Z"
}
```

#### PATCH `/auth/update-profile/`
Update user profile.

**Request**:
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "9841234568"
}
```

#### POST `/auth/password-reset/`
Request password reset email.

**Request**:
```json
{
  "email": "user@example.com"
}
```

#### POST `/auth/password-reset-confirm/{uid64}/{token}/`
Confirm password reset with token from email.

**Request**:
```json
{
  "new_password": "newsecurepassword"
}
```

#### POST `/auth/set-new-password/`
Set new password (for authenticated users).

**Request**:
```json
{
  "old_password": "oldpassword",
  "new_password": "newpassword"
}
```

#### POST `/auth/logout/`
Logout current user.

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

#### GET `/auth/list/`
List all users (Admin only).

**Response** (200):
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "customer",
    "is_active": true,
    "is_verified": true
  }
]
```

### 5.9 Payment Endpoints (Extended)

#### POST `/payments/initiate/`
Initiate a payment (documented in 5.5).

#### POST `/payments/verify-esewa/`
Verify eSewa payment (alias for `/payments/verify/`).

#### POST `/payments/verify-bank/{transaction_uuid}/`
Verify bank transfer payment (Admin only).

**Request**:
```json
{
  "verified": true,
  "notes": "Payment verified via bank statement"
}
```

#### GET `/payments/pending-bank/`
Get pending bank transfer payments (Admin only).

**Response** (200):
```json
[
  {
    "transaction_uuid": "240115-143000-abc12345",
    "user": "customer@example.com",
    "total_amount": 500.00,
    "created_at": "2024-01-15T14:30:00Z",
    "branch": "Main Branch"
  }
]
```

#### GET `/payments/status/{transaction_uuid}/`
Check payment status.

**Response** (200):
```json
{
  "transaction_uuid": "240115-143000-abc12345",
  "status": "COMPLETE",
  "total_amount": 500.00,
  "payment_type": "esewa"
}
```

#### GET `/payments/subscription/status/`
Get user's subscription status.

**Response** (200):
```json
{
  "is_active": true,
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-02-01T00:00:00Z"
}
```

#### GET `/payments/history/`
Get payment history (alias for `/payments/user-payments/`).

### 5.10 Accounting Endpoints (Extended)

#### GET `/accounting/data/`
Get comprehensive accounting data (Admin only).

**Response** (200):
```json
{
  "total_income": 150000.00,
  "total_expenses": 80000.00,
  "net_profit": 70000.00,
  "income_by_category": [...],
  "expenses_by_category": [...]
}
```

#### GET `/accounting/income/`
List income records (Admin only).

**Query Parameters**:
- `branch`: Filter by branch ID
- `category`: Filter by category ID
- `date_from`: Filter by start date
- `date_to`: Filter by end date

**Response** (200):
```json
[
  {
    "id": 1,
    "branch": "Main Branch",
    "category": "Payment",
    "amount": 500.00,
    "date_received": "2024-01-15",
    "description": "Order payment"
  }
]
```

#### POST `/accounting/income/`
Create income record (Admin only).

**Request**:
```json
{
  "branch": 1,
  "category": 1,
  "amount": 500.00,
  "date_received": "2024-01-15",
  "description": "Manual income entry"
}
```

#### GET `/accounting/income/{id}/`
Get specific income record (Admin only).

#### PUT/PATCH `/accounting/income/{id}/`
Update income record (Admin only).

#### DELETE `/accounting/income/{id}/`
Delete income record (Admin only).

#### GET `/accounting/income/by-time/`
Get income aggregated by time period (Admin only).

**Query Parameters**:
- `period`: `day`, `week`, `month`, `year`
- `date_from`: Start date
- `date_to`: End date

**Response** (200):
```json
[
  {
    "period": "2024-01",
    "total": 50000.00,
    "count": 25
  }
]
```

#### GET `/accounting/income/statistics/`
Get income statistics (Admin only).

**Response** (200):
```json
{
  "total": 150000.00,
  "average": 6000.00,
  "count": 25,
  "by_category": [...]
}
```

#### GET `/accounting/expenses/`
List expense records (Admin only).

**Query Parameters**: Same as income endpoints

**Response** (200):
```json
[
  {
    "id": 1,
    "branch": "Main Branch",
    "category": "Utilities",
    "amount": 5000.00,
    "date_incurred": "2024-01-15",
    "description": "Electricity bill"
  }
]
```

#### POST `/accounting/expenses/`
Create expense record (Admin only).

#### GET `/accounting/expenses/{id}/`
Get specific expense record (Admin only).

#### PUT/PATCH `/accounting/expenses/{id}/`
Update expense record (Admin only).

#### DELETE `/accounting/expenses/{id}/`
Delete expense record (Admin only).

#### GET `/accounting/expenses/by-time/`
Get expenses aggregated by time period (Admin only).

#### GET `/accounting/income-categories/`
List income categories (Admin only).

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "Payment"
  },
  {
    "id": 2,
    "name": "Other Income"
  }
]
```

#### POST `/accounting/income-categories/`
Create income category (Admin only).

#### GET/PUT/PATCH/DELETE `/accounting/income-categories/{id}/`
Manage specific income category (Admin only).

#### GET `/accounting/expense-categories/`
List expense categories (Admin only).

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "Utilities"
  },
  {
    "id": 2,
    "name": "Salaries"
  },
  {
    "id": 3,
    "name": "Supplies"
  }
]
```

#### POST `/accounting/expense-categories/`
Create expense category (Admin only).

#### GET/PUT/PATCH/DELETE `/accounting/expense-categories/{id}/`
Manage specific expense category (Admin only).

#### GET `/accounting/reports/time-period/`
Get time period report (Admin only).

**Query Parameters**:
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `branch`: Optional branch ID filter

**Response** (200):
```json
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "income": 50000.00,
  "expenses": 30000.00,
  "profit": 20000.00,
  "income_by_category": [...],
  "expenses_by_category": [...]
}
```

#### GET `/accounting/reports/branch-insights/`
Get branch performance insights (Admin only).

**Query Parameters**:
- `branch`: Branch ID (optional, defaults to all branches)

**Response** (200):
```json
{
  "branch_name": "Main Branch",
  "total_revenue": 150000.00,
  "total_expenses": 80000.00,
  "net_profit": 70000.00,
  "profit_margin": 46.67,
  "top_expense_categories": [...],
  "monthly_trend": [...]
}
```

#### GET `/accounting/reports/full-accounting/`
Get comprehensive accounting report (Admin only).

**Query Parameters**:
- `start_date`: Start date
- `end_date`: End date

**Response** (200):
```json
{
  "summary": {
    "total_income": 150000.00,
    "total_expenses": 80000.00,
    "net_profit": 70000.00
  },
  "by_branch": [...],
  "income_details": [...],
  "expense_details": [...]
}
```

#### GET `/accounting/reports/branch-summary/`
Get financial summary for all branches (Admin only).

**Response** (200):
```json
[
  {
    "branch_id": 1,
    "branch_name": "Main Branch",
    "revenue": 50000.00,
    "expenses": 30000.00,
    "profit": 20000.00,
    "profit_margin": 40.00
  }
]
```

### 5.11 Service Configuration Endpoints (Extended)

#### GET `/services/wash-types/`
List all wash types.

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "Dry Wash",
    "is_active": true
  },
  {
    "id": 2,
    "name": "Machine Wash",
    "is_active": true
  }
]
```

#### POST `/services/wash-types/`
Create wash type (Admin only).

#### GET/PUT/PATCH/DELETE `/services/wash-types/{id}/`
Manage specific wash type (Admin only).

#### GET `/services/cloth-names/`
List all cloth names.

#### POST `/services/cloth-names/`
Create cloth name (Admin only).

#### GET/PUT/PATCH/DELETE `/services/cloth-names/{id}/`
Manage specific cloth name (Admin only).

#### GET `/services/cloth-types/`
List all cloth types/materials.

#### POST `/services/cloth-types/`
Create cloth type (Admin only).

#### GET/PUT/PATCH/DELETE `/services/cloth-types/{id}/`
Manage specific cloth type (Admin only).

#### GET `/services/pricing-rules/`
List all pricing rules (documented in 5.6).

#### POST `/services/pricing-rules/`
Create pricing rule (Admin only).

**Request**:
```json
{
  "wash_type": 1,
  "cloth_name": 2,
  "cloth_type": 3,
  "price": 250.00,
  "is_active": true
}
```

#### GET/PUT/PATCH/DELETE `/services/pricing-rules/{id}/`
Manage specific pricing rule (Admin only).

---

## 5.12 Frontend Architecture

### 5.12.1 State Management Approach

The frontend uses a **hybrid state management approach** combining multiple strategies:

#### Context API for Global State
Used for authentication and language/internationalization:

```typescript
// AuthContext.tsx
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading, error } = useAuthQuery();
  
  const value: AuthContextType = {
    user: user || null,
    isAuthenticated,
    isLoading,
    error,
    hasRole,
    hasAnyRole,
    logout,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

**Usage**:
```typescript
const { user, isAuthenticated, hasRole } = useAuth();
```

**Contexts**:
- `AuthContext`: User authentication state, role checking
- `LanguageContext`: i18n language selection

#### React Query (@tanstack/react-query) for Server State
Primary data fetching and caching library:

```typescript
// authQueries.ts
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      queryClient.setQueryData(authKeys.profile(), user);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
};

export const useProfile = () => {
  return useQuery<User, ApiError>({
    queryKey: authKeys.profile(),
    queryFn: authApi.getProfile,
    enabled: !!getAccessToken(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

**Benefits**:
- Automatic caching and background refetching
- Optimistic updates
- Request deduplication
- Automatic retry logic
- Loading and error states built-in

**Query Keys Structure**:
```typescript
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};
```

#### useState for Local Component State
Used for UI state, form inputs, and temporary data:

```typescript
// orders/page.tsx
const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState<string>("all");
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [form, setForm] = useState({
  customerName: "",
  amount: "",
  // ...
});
```

**Use Cases**:
- Form inputs
- Modal/dialog open/close states
- Search and filter values
- Temporary UI states

#### useMemo for Derived State
Used for computed values to avoid unnecessary recalculations:

```typescript
const filteredOrders = useMemo(() => {
  return orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (!searchTerm) return true;
    return o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
  });
}, [orders, searchTerm, statusFilter]);

const statusCounts = useMemo(() => {
  const map: Record<OrderStatus, number> = { /* ... */ };
  orders.forEach((o) => {
    map[o.status] = (map[o.status] || 0) + 1;
  });
  return map;
}, [orders]);
```

### 5.12.2 Form Validation Strategy

The application uses **manual validation** with custom validation functions:

#### Inline Validation
```typescript
const handleCreateOrder = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate required fields
  if (!form.customerName.trim()) {
    alert('Please enter customer name');
    return;
  }
  
  const orderAmount = Number(form.amount) || 0;
  if (orderAmount <= 0) {
    alert('Please enter a valid amount');
    return;
  }
  
  // Proceed with submission
  try {
    const order = await orderAPI.create(orderData);
    // ...
  } catch (error) {
    // Handle error
  }
};
```

#### Email Validation Example
```typescript
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Usage
if (!validateEmail(form.email)) {
  setError('Please enter a valid email address');
  return;
}
```

#### Password Validation Example
```typescript
const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  return { valid: true };
};
```

**Validation Approach**:
- ✅ Simple and straightforward
- ✅ No external dependencies
- ✅ Full control over validation logic
- ⚠️ Manual error state management
- ⚠️ Repetitive code for similar validations

**Future Improvement**: Consider adding a validation library like `react-hook-form` or `formik` for complex forms.

### 5.12.3 Error Handling Strategy

#### API Error Handling with Axios Interceptors
```typescript
// api.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - attempt refresh
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await refreshAccessToken(refreshToken);
          setTokens(response.access_token, response.refresh_token);
          // Retry original request
          return api.request(error.config);
        } catch (refreshError) {
          // Refresh failed - logout
          clearTokens();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

#### Component-Level Error Handling
```typescript
const fetchOrders = useCallback(async () => {
  try {
    setIsLoading(true);
    setError(null);
    const backendOrders = await orderAPI.list({ ordering: "-created" });
    setOrders(displayOrders);
  } catch (err: unknown) {
    console.error('Error fetching orders:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
    setError(errorMessage);
  } finally {
    setIsLoading(false);
  }
}, []);
```

#### Error Display in UI
```typescript
{error && (
  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
    <div className="flex">
      <FaExclamationTriangle className="text-red-400" />
      <p className="text-sm text-red-700">{error}</p>
      <button onClick={fetchOrders} className="underline">
        Retry
      </button>
    </div>
  </div>
)}
```

#### React Query Error Handling
```typescript
export const useLogin = () => {
  return useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationFn: authApi.login,
    onError: (error) => {
      console.error('Login error:', error);
      // Error is automatically available in mutation.error
    },
  });
};

// Usage in component
const loginMutation = useLogin();

if (loginMutation.isError) {
  return <div>Error: {loginMutation.error.message}</div>;
}
```

#### Detailed Error Extraction
```typescript
try {
  await orderAPI.create(orderData);
} catch (error: unknown) {
  let errorMessage = 'Failed to create order. Please try again.';
  
  if (error && typeof error === 'object' && 'response' in error) {
    const errorResponse = error as { response?: { data?: unknown } };
    if (errorResponse.response?.data) {
      if (typeof errorResponse.response.data === 'string') {
        errorMessage = errorResponse.response.data;
      } else if (typeof errorResponse.response.data === 'object') {
        const data = errorResponse.response.data as Record<string, unknown>;
        errorMessage = String(data.detail || data.error || errorMessage);
      }
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }
  
  alert(`Error: ${errorMessage}`);
}
```

**Error Handling Patterns**:
- ✅ Centralized error interception (Axios)
- ✅ Automatic token refresh on 401
- ✅ Component-level try-catch blocks
- ✅ User-friendly error messages
- ✅ Retry mechanisms
- ⚠️ Currently using `alert()` - should use toast notifications

### 5.12.4 Loading State Management

#### Local Loading States
```typescript
const [isLoading, setIsLoading] = useState(true);
const [isProcessingPayment, setIsProcessingPayment] = useState(false);

const fetchData = async () => {
  try {
    setIsLoading(true);
    const data = await api.get('/endpoint');
    setData(data);
  } finally {
    setIsLoading(false);
  }
};
```

#### React Query Loading States
```typescript
const { data: user, isLoading, isFetching, isError } = useProfile();

// isLoading: Initial load (no cached data)
// isFetching: Background refetch (has cached data)
// isError: Query failed
```

#### Conditional Rendering Based on Loading
```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

// Inline loading indicators
{isLoading && (
  <div className="flex items-center gap-2 text-blue-600 text-sm">
    <FaSpinner className="animate-spin" />
    <span>Loading orders...</span>
  </div>
)}
```

#### Button Loading States
```typescript
<button
  onClick={handleSubmit}
  disabled={isProcessingPayment}
  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
>
  {isProcessingPayment ? (
    <>
      <FaSpinner className="animate-spin" />
      Processing...
    </>
  ) : (
    'Submit Payment'
  )}
</button>
```

#### Skeleton Loading (Future Enhancement)
Currently not implemented, but recommended pattern:
```typescript
{isLoading ? (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
) : (
  <div>{actualContent}</div>
)}
```

### 5.12.5 Data Flow Summary

```
User Action
    ↓
Component Event Handler
    ↓
React Query Mutation / API Call
    ↓
Axios Request (with JWT interceptor)
    ↓
Backend API
    ↓
Response / Error
    ↓
React Query Cache Update
    ↓
Component Re-render
    ↓
UI Update
```

### 5.12.6 Best Practices Implemented

✅ **Separation of Concerns**:
- API calls in service files (`orderService.ts`, `branchService.ts`)
- React Query hooks in query files (`authQueries.ts`)
- UI components separate from business logic

✅ **Type Safety**:
- TypeScript interfaces for all data structures
- Typed API responses
- Typed React Query hooks

✅ **Performance Optimization**:
- `useMemo` for expensive computations
- `useCallback` for stable function references
- React Query caching to reduce API calls

✅ **User Experience**:
- Loading indicators for all async operations
- Error messages with retry options
- Optimistic updates where applicable

⚠️ **Areas for Improvement**:
- Add form validation library (react-hook-form)
- Replace `alert()` with toast notifications
- Add skeleton loaders for better perceived performance
- Implement error boundary components
- Add request cancellation for abandoned requests

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

```
1. User Login → POST /users/login/
2. Backend validates credentials
3. Backend generates JWT tokens (access + refresh)
4. Frontend stores tokens in localStorage
5. Frontend includes access token in Authorization header
6. Backend validates token on each request
7. Token expires after 180 minutes
8. Frontend refreshes token using refresh token
```

### 6.2 JWT Configuration
```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=180),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "AUTH_HEADER_TYPES": ('Bearer',),
}
```

### 6.3 Frontend Token Management
```typescript
// Axios interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      const refreshToken = localStorage.getItem('refresh_token');
      const response = await refreshAccessToken(refreshToken);
      // Retry original request
    }
    return Promise.reject(error);
  }
);
```

---

## 7. User Roles & Permissions

### 7.1 Role Hierarchy

```
Admin (Superuser)
  ├── Full system access
  ├── Manage all branches
  ├── Manage all users
  ├── View accounting
  └── Configure system settings

Branch Manager
  ├── Manage own branch only
  ├── View branch orders
  ├── View branch performance
  ├── Update order statuses
  └── Manage branch staff

Rider
  ├── View assigned deliveries
  ├── Update delivery status
  └── View delivery addresses

Customer
  ├── Place orders
  ├── View own orders
  ├── Make payments
  └── View payment history

Accountant
  ├── View accounting data
  ├── Generate reports
  └── (Future implementation)
```

### 7.2 Permission Classes

```python
# Custom permission classes
IsAdmin                  # Admin only
IsBranchManager          # Branch manager only
IsRider                  # Rider only
IsCustomer               # Customer only
IsAdminOrBranchManager   # Admin or branch manager
CanManageOrders          # Admin or branch manager (branch-scoped)
CanManagePickups         # Admin, branch manager, or rider
CanManagePayments        # Admin or branch manager
CanViewAccounting        # Admin only
```

### 7.3 Data Access Rules

#### Branch Managers
- **Branches**: Can only view their assigned branch
- **Orders**: Can only view/edit orders from their branch
- **Deliveries**: Can only view deliveries for their branch's orders
- **Payments**: Can only view payments for their branch
- **Performance**: Can only view their branch's performance data

#### Riders
- **Deliveries**: Can only view deliveries assigned to them
- **Orders**: Can view order details for assigned deliveries

#### Customers
- **Orders**: Can only view/create their own orders
- **Payments**: Can only view their own payments
- **Addresses**: Can only manage their own addresses

---

## 8. Business Logic & Workflows

### 8.1 Order Creation Workflow

```
1. Customer selects branch and services
2. System calculates pricing based on PricingRule
3. Customer selects pickup/delivery options
4. System adds pickup_cost, delivery_cost, urgent_fee
5. Customer selects payment method
6. Order created with status "dropped by user" or "pending pickup"
7. If payment_method = "esewa":
   a. Redirect to eSewa payment gateway
   b. On success, payment status = "paid"
8. System auto-assigns order to first available rider
9. System checks for advance payments and applies them
10. If fully paid via advance, payment_status = "paid"
```

### 8.2 Advance Payment System

**Concept**: Customers can pay in advance, and the system automatically applies these payments to future orders.

**Flow**:
```
1. Customer makes payment from payment page (payment_source = "payment_page")
2. Payment record created with status "COMPLETE"
3. When customer creates new order:
   a. System finds advance payments for same branch
   b. System calculates remaining balance on each payment
   c. System applies payments oldest-first until order is paid
   d. OrderPayment records created for each application
   e. Order payment_status updated (pending/partially_paid/paid)
```

**Example**:
```
Advance Payment: ₨1000 to Main Branch
Order 1: ₨600 → ₨600 applied, ₨400 remaining
Order 2: ₨500 → ₨400 applied, ₨100 pending, payment_status = "partially_paid"
```

### 8.3 VIP Customer System

**Trigger**: Post-save signal on Order model

**Logic**:
```python
if order.status in ['delivered', 'completed', 'paid']:
    monthly_spend = calculate_monthly_spend(user)
    if monthly_spend > 50000:
        user.is_vip = True
        user.save()
```

**Benefits**: Future discounts, priority service (to be implemented)

### 8.4 Order Status Lifecycle

```
dropped by user → pending pickup → picked up → sent to wash → 
in wash → washed → picked by client / pending delivery → delivered
```

**Alternative flows**:
- `dropped by user` → `cancelled`
- Any status → `refunded`

### 8.5 Delivery Status Updates

**Pickup Delivery**:
```
pending → in_progress → delivered
  └─> Order status: "pending pickup" → "picked up"
```

**Drop Delivery**:
```
pending → in_progress → delivered
  └─> Order status: "pending delivery" → "delivered"
```

### 8.6 Income Tracking

**Automatic Income Creation**:
```
When Payment.status = "COMPLETE":
  1. Create Income record
  2. Set income.branch = payment.branch
  3. Set income.category = "Payment"
  4. Set income.amount = payment.total_amount
  5. Set income.date_received = today
  6. Link payment.income_record = income
```

**Purpose**: Enables accurate revenue tracking per branch

---

## 9. Payment Integration

### 9.1 eSewa Configuration

**Environment**: UAT (User Acceptance Testing)

```python
ESEWA_SECRET_KEY = '8gBm/:&EnhH.1/q'
ESEWA_PRODUCT_CODE = 'EPAYTEST'
ESEWA_PAYMENT_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
ESEWA_STATUS_CHECK_URL = 'https://rc.esewa.com.np/api/epay/transaction/status/'
```

### 9.2 Payment Flow

```
1. Frontend: User initiates payment
2. Backend: Create Payment record (status = PENDING)
3. Backend: Generate signature using HMAC-SHA256
4. Backend: Return payment form data + eSewa URL
5. Frontend: Auto-submit form to eSewa
6. eSewa: User completes payment
7. eSewa: Redirects to success_url with encoded response
8. Frontend: Sends encoded response to /payments/verify/
9. Backend: Decodes response, validates signature
10. Backend: Calls eSewa status check API
11. Backend: Updates Payment.status = COMPLETE
12. Backend: Creates Income record
13. Frontend: Shows success message
```

### 9.3 Signature Generation

```python
import hmac
import hashlib
import base64

def generate_signature(message: str, secret: str) -> str:
    """Generate HMAC-SHA256 signature for eSewa"""
    hash_obj = hmac.new(
        secret.encode(),
        message.encode(),
        hashlib.sha256
    )
    return base64.b64encode(hash_obj.digest()).decode()

# Message format
message = f"total_amount={total},transaction_uuid={uuid},product_code={code}"
signature = generate_signature(message, ESEWA_SECRET_KEY)
```

### 9.4 Payment Verification

```python
def verify_payment(encoded_response: str):
    # 1. Decode base64 response
    decoded = base64.b64decode(encoded_response).decode()
    data = json.loads(decoded)
    
    # 2. Verify signature
    message = f"transaction_code={data['transaction_code']},status={data['status']}..."
    expected_sig = generate_signature(message, ESEWA_SECRET_KEY)
    if data['signature'] != expected_sig:
        raise ValidationError("Invalid signature")
    
    # 3. Call eSewa status check API
    response = requests.get(
        ESEWA_STATUS_CHECK_URL,
        params={'product_code': ESEWA_PRODUCT_CODE, 'total_amount': data['total_amount'], ...}
    )
    
    # 4. Update payment record
    payment.status = response.json()['status']
    payment.transaction_code = data['transaction_code']
    payment.save()
```

### 9.5 Idempotency

**Problem**: User might refresh payment page, creating duplicate payments

**Solution**: Idempotency key

```python
idempotency_key = f"{user.id}-{order_id}-{timestamp}"

# Check for existing payment
existing = Payment.objects.filter(
    user=user,
    idempotency_key=idempotency_key
).first()

if existing:
    return existing  # Return existing payment instead of creating new
```

---

## 10. Development Setup

### 10.1 Prerequisites
- Python 3.8+
- Node.js 18+
- Git

### 10.2 Backend Setup

```bash
# Clone repository
git clone <repository-url>
cd Laundry/backend

# Create virtual environment
python -m venv env
source env/bin/activate  # Windows: env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

### 10.3 Frontend Setup

```bash
cd Laundry/frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local

# Run development server
npm run dev
```

### 10.4 Environment Variables

**Backend (.env)**:
```
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DJANGO_SUPERUSER_EMAIL=admin@laundry.com
DJANGO_SUPERUSER_PASSWORD=adminpass
DJANGO_SUPERUSER_FIRST_NAME=Admin
DJANGO_SUPERUSER_LAST_NAME=User
DJANGO_SUPERUSER_PHONE=9841234567
```

**Frontend (.env.local)**:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 10.5 Database Initialization

```bash
# Populate services (wash types, cloth types, pricing)
python populate_services.py

# Create test data
python create_test_data.py

# Add expense categories
python add_expense_categories.py
```

---

## 11. Deployment Guide

### 11.1 Backend Deployment (Render)

```bash
# 1. Create render.yaml
services:
  - type: web
    name: laundry-backend
    env: python
    buildCommand: "pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate"
    startCommand: "gunicorn backend.wsgi:application"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: SECRET_KEY
        generateValue: true
      - key: DEBUG
        value: False

# 2. Update settings.py
ALLOWED_HOSTS = ['your-app.onrender.com']
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# 3. Add gunicorn to requirements.txt
gunicorn==21.2.0

# 4. Deploy to Render
git push origin main
```

### 11.2 Frontend Deployment (Vercel)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
cd frontend
vercel

# 3. Set environment variables in Vercel dashboard
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api

# 4. Production deployment
vercel --prod
```

### 11.3 Database Migration

**For Production**:
```bash
# Use PostgreSQL instead of SQLite
pip install psycopg2-binary

# Update settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': '5432',
    }
}
```

### 11.4 CORS Configuration

```python
# Production settings
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend.vercel.app",
]

CSRF_TRUSTED_ORIGINS = [
    "https://your-frontend.vercel.app",
    "https://your-backend.onrender.com",
]
```

---

## 12. Security Considerations

### 12.1 Authentication Security
- ✅ JWT tokens with 180-minute expiration
- ✅ Refresh tokens with 1-day expiration
- ✅ Password hashing with Django's default (PBKDF2)
- ✅ Email verification for new accounts
- ⚠️ **TODO**: Implement rate limiting on login endpoint
- ⚠️ **TODO**: Add CAPTCHA for registration

### 12.2 Authorization Security
- ✅ Role-based access control (RBAC)
- ✅ Object-level permissions (Branch Managers can only access their branch)
- ✅ Query-level filtering (automatic data scoping)
- ✅ Permission classes on all sensitive endpoints

### 12.3 Payment Security
- ✅ HMAC-SHA256 signature verification
- ✅ Idempotency keys to prevent duplicate payments
- ✅ Server-side payment verification (not trusting client)
- ✅ Payment status validation via eSewa API
- ⚠️ **TODO**: Implement webhook for payment status updates

### 12.4 Data Security
- ✅ CORS configuration (whitelist only)
- ✅ CSRF protection enabled
- ✅ SQL injection prevention (Django ORM)
- ✅ XSS prevention (React auto-escaping)
- ⚠️ **TODO**: Implement HTTPS in production
- ⚠️ **TODO**: Add request logging and monitoring

### 12.5 Production Checklist
- [ ] Change `SECRET_KEY` to environment variable
- [ ] Set `DEBUG = False`
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS
- [ ] Configure proper ALLOWED_HOSTS
- [ ] Set up backup strategy
- [ ] Implement monitoring (Sentry, etc.)
- [ ] Add rate limiting
- [ ] Enable security headers (HSTS, CSP, etc.)

---

## Appendix A: API Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

---

## Appendix B: Database Indexes

**Recommended indexes for production**:
```python
# orders/models.py
class Order:
    class Meta:
        indexes = [
            models.Index(fields=['branch', '-created']),
            models.Index(fields=['customer_name', '-created']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_status']),
        ]

# payments/models.py
class Payment:
    class Meta:
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['branch', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['idempotency_key']),
        ]
```

---

## Appendix C: Useful Commands

```bash
# Backend
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic
python manage.py shell
python manage.py dbshell

# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Lint code

# Database
python manage.py dumpdata > backup.json
python manage.py loaddata backup.json
```

---

**Document Version**: 1.0  
**Last Updated**: January 4, 2026  
**Maintained By**: Development Team
