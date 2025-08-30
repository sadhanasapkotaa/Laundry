# Laundry Management System - Backend API

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [Application Modules](#application-modules)
- [API Endpoints](#api-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Payment Integration](#payment-integration)
- [Data Flow](#data-flow)
- [Setup & Configuration](#setup--configuration)
- [Testing](#testing)

## Overview

The Laundry Management System is a comprehensive Django REST Framework backend that manages laundry service operations including user management, service ordering, branch operations, payment processing, and financial accounting. The system supports multiple user roles and provides a complete workflow from order placement to delivery tracking.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                     HTTP/JSON API Calls                        │
├─────────────────────────────────────────────────────────────────┤
│                    Django REST Framework                        │
├──────────────┬─────────────┬─────────────┬─────────────────────┤
│   Users App  │ Services App│ Orders App  │   Branches App      │
├──────────────┼─────────────┼─────────────┼─────────────────────┤
│ Payments App │Accounting App│   Backend   │    Email Service    │
├─────────────────────────────────────────────────────────────────┤
│                       SQLite Database                          │
├─────────────────────────────────────────────────────────────────┤
│                     External Integrations                      │
│                  eSewa Payment Gateway                         │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

- **Framework**: Django 5.2.4 with Django REST Framework
- **Authentication**: JWT (Simple JWT)
- **Database**: SQLite (Development), PostgreSQL ready
- **Payment Gateway**: eSewa Integration
- **Email**: SMTP with Gmail
- **API Documentation**: Postman Collection
- **Development Tools**: Django Debug Toolbar, CORS Headers

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │   Branch    │    │   Service   │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)     │    │ id (UUID PK)│
│ email       │◄──┐│ name        │    │ name        │
│ first_name  │   ││ branch_id   │    │ service_type│
│ last_name   │   ││ manager     │    │ description │
│ role        │   │└─────────────┘    └─────────────┘
│ is_verified │   │                           │
│ is_active   │   │                           │
└─────────────┘   │                           │
                  │                           │
┌─────────────┐   │    ┌─────────────┐       │
│BranchManager│───┘    │    Order    │       │
├─────────────┤        ├─────────────┤       │
│ user (FK)   │        │ order_id(PK)│───────┘
│ branch (FK) │        │ customer(FK)│
│ manager_id  │        │ service(FK) │
│ salary      │        │ branch (FK) │
│ hired_date  │        │ status      │
└─────────────┘        │ total_amount│
                       └─────────────┘
                               │
                       ┌─────────────┐
                       │  Delivery   │
                       ├─────────────┤
                       │ order (FK)  │
                       │ address     │
                       │ delivery_type│
                       │ person (FK) │
                       │ status      │
                       └─────────────┘

┌─────────────┐    ┌─────────────┐
│   Payment   │    │Subscription │
├─────────────┤    ├─────────────┤
│ user (FK)   │◄───┤ user (FK)   │
│ trans_uuid  │    │ payment(FK) │
│ amount      │────┤ is_active   │
│ status      │    │ start_date  │
│ created_at  │    │ end_date    │
└─────────────┘    └─────────────┘

┌─────────────┐    ┌─────────────┐
│   Income    │    │   Expense   │
├─────────────┤    ├─────────────┤
│ source      │    │ expense_type│
│ amount      │    │ amount      │
│ branch (FK) │    │ branch (FK) │
│ date_received│    │ date_incurred│
└─────────────┘    └─────────────┘
```

## Application Modules

### 1. Users App (`users/`)
**Purpose**: Manages user authentication, registration, and role-based access control.

**Key Components**:
- **Custom User Model**: Extends AbstractUser with email-based authentication
- **Role System**: Admin, Branch Manager, Rider, Customer roles
- **OTP Verification**: Email-based account verification
- **JWT Authentication**: Token-based authentication system

**Models**:
```python
class User(AbstractUser):
    email = EmailField(unique=True)
    role = CharField(choices=Role.choices)
    is_verified = BooleanField(default=False)
    
class OneTimePassword:
    user = OneToOneField(User)
    code = CharField(max_length=6)
```

### 2. Services App (`services/`)
**Purpose**: Defines laundry services, pricing, and service configurations.

**Key Components**:
- **Service Types**: Individual clothes, bulk (kg), hybrid services
- **Wash Types**: Machine wash, dry cleaning, etc.
- **Delivery Types**: Pickup only, delivery only, full service
- **Dynamic Pricing**: Configurable costs per service combination

**Models**:
```python
class Service:
    service_type = CharField(choices=[('individual', 'bulk', 'hybrid')])
    
class ServiceCost:
    service = ForeignKey(Service)
    wash_type = ForeignKey(WashType)
    delivery_type = ForeignKey(DeliveryType)
    base_cost = DecimalField()
```

### 3. Orders App (`orders/`)
**Purpose**: Handles order lifecycle from creation to completion.

**Key Components**:
- **Order Management**: Complete order workflow
- **Status Tracking**: Multiple status states (pending, in_progress, completed)
- **Delivery Coordination**: Pickup and drop-off management
- **Service Integration**: Links to services and branches

**Order Workflow**:
```
[Customer Places Order] → [Pickup Requested] → [In Progress] 
                                                      ↓
[Completed] ← [To Be Delivered] ← [Processing Complete]
```

### 4. Branches App (`branches/`)
**Purpose**: Manages branch locations and branch manager assignments.

**Key Components**:
- **Branch Management**: Location and operational data
- **Manager Assignment**: Links managers to specific branches
- **HR Management**: Salary, hiring dates, identification tracking

### 5. Payments App (`payments/`)
**Purpose**: Handles payment processing and subscription management.

**Key Components**:
- **eSewa Integration**: Payment gateway integration
- **Subscription Model**: Recurring subscription management
- **Transaction Tracking**: Complete payment audit trail
- **Status Management**: Real-time payment status updates

**Payment Flow**:
```
[Initiate Payment] → [Generate Signature] → [Redirect to eSewa]
                                                      ↓
[Payment Complete] ← [Verify Status] ← [eSewa Callback]
                            ↓
                    [Update Subscription]
```

### 6. Accounting App (`accounting/`)
**Purpose**: Financial management and reporting system.

**Key Components**:
- **Income Tracking**: Revenue from multiple sources
- **Expense Management**: Categorized expense tracking
- **Branch-wise Reports**: Individual branch performance
- **Time-based Analytics**: Weekly, monthly, yearly reports

**Reporting Features**:
- Full accounting reports with profit/loss
- Branch performance insights
- Time-period specific analysis
- Income vs expense comparisons

## API Endpoints

### Authentication Endpoints (`/auth/`)
```
POST   /auth/register/           # User registration
POST   /auth/verify/             # Email verification
POST   /auth/login/              # User login
GET    /auth/profile/            # Get user profile
POST   /auth/password-reset/     # Request password reset
POST   /auth/logout/             # User logout
```

### Service Management (`/service/`)
```
GET    /service/services/        # List all services
POST   /service/services/        # Create new service
GET    /service/services/{id}/   # Get specific service
PUT    /service/services/{id}/   # Update service
DELETE /service/services/{id}/   # Delete service
```

### Order Management (`/orders/`)
```
GET    /orders/orders/           # List orders
POST   /orders/orders/create/    # Create new order
GET    /orders/orders/{id}/      # Get order details
PUT    /orders/orders/{id}/      # Update order
DELETE /orders/orders/{id}/      # Cancel order
```

### Payment Processing (`/payment/`)
```
POST   /payment/initiate/        # Start payment process
GET    /payment/status/{uuid}/   # Check payment status
GET    /payment/subscription/status/ # Get subscription status
POST   /payment/success/         # Payment success callback
POST   /payment/failure/         # Payment failure callback
```

### Branch Management (`/branch/`)
```
GET    /branch/branches/         # List branches
POST   /branch/branches/create/  # Create branch
GET    /branch/managers/         # List branch managers
POST   /branch/managers/create/  # Assign manager
```

### Accounting (`/account/`)
```
GET    /account/income/          # List income records
POST   /account/income/          # Record income
GET    /account/expenses/        # List expenses
POST   /account/expenses/        # Record expense
GET    /account/reports/time-period/ # Time-based reports
GET    /account/reports/branch-insights/ # Branch analytics
GET    /account/reports/full-accounting/ # Complete financial report
```

## Authentication & Authorization

### JWT Token System
- **Access Token**: 180 minutes lifetime
- **Refresh Token**: 1 day lifetime
- **Token Format**: Bearer token in Authorization header

### Role-Based Access Control
```python
class Role(models.TextChoices):
    ADMIN = 'admin'                # Full system access
    BRANCH_MANAGER = 'branch_manager'  # Branch-specific access
    RIDER = 'rider'               # Delivery management
    CUSTOMER = 'customer'         # Order placement only
```

### Permission Matrix
| Endpoint           | Admin | Branch Manager | Rider         | Customer    |
|----------          |-------|----------------|---------------|-------------|
| User Management    | ✓     | ✗             | ✗             | Profile Only |
| Service Management | ✓     | ✓             | ✗             | Read Only   |
| Order Management   | ✓     | ✓             | Delivery Only | Own Orders  |
| Branch Management  | ✓     | Own Branch    | ✗             | ✗           |
| Payments           | ✓     | ✗             | ✗            | Own Payments |
| Accounting         | ✓     | Own Branch    | ✗             | ✗           |

## Payment Integration

### eSewa Configuration
```python
# UAT Configuration (Development)
ESEWA_SECRET_KEY = '8gBm/:&EnhH.1/q'
ESEWA_PRODUCT_CODE = 'EPAYTEST'
ESEWA_PAYMENT_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
ESEWA_STATUS_CHECK_URL = 'https://rc.esewa.com.np/api/epay/transaction/status/'
```

### Payment Security
- **Digital Signature**: SHA256 HMAC signature verification
- **Transaction UUID**: Unique identifier for each transaction
- **Status Verification**: Real-time status checking with eSewa
- **Subscription Linking**: Automatic subscription activation

### Payment States
```
PENDING → COMPLETE → [Subscription Activated]
    ↓
FAILED/CANCELED → [No Subscription Change]
```

## Data Flow

### User Registration Flow
```
1. User submits registration data
2. Create User record (is_verified=False)
3. Generate OTP and send email
4. User verifies email with OTP
5. Set is_verified=True
6. User can now login and access system
```

### Order Processing Flow
```
1. Customer places order
2. Order created with 'pending' status
3. If pickup requested → status: 'asked pickup'
4. Branch processes order → status: 'in_progress'
5. Service completion → status: 'to be delivered'
6. Delivery completed → status: 'completed'
7. Income record created in accounting
```

### Payment & Subscription Flow
```
1. User initiates payment
2. Generate unique transaction UUID
3. Create Payment record (status: PENDING)
4. Generate eSewa signature
5. Redirect to eSewa payment page
6. User completes payment
7. eSewa callback to success/failure URL
8. Verify payment status with eSewa API
9. Update Payment status
10. If successful, create/update Subscription
```

## Setup & Configuration

### Environment Variables
```bash
# Required in .env file
SECRET_KEY=your-django-secret-key
DEBUG=True
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Database Setup
```bash
# Apply migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### Running the Server
```bash
# Development server
python manage.py runserver

# With specific host and port
python manage.py runserver 0.0.0.0:8000
```

### CORS Configuration
Frontend URLs must be added to `CORS_ALLOWED_ORIGINS` in settings.py:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js development
    "http://127.0.0.1:3000",
]
```

## Testing

### Postman Collection
A comprehensive Postman collection (`postmantest.json`) is included with:
- All API endpoints
- Authentication workflows
- Sample request/response data
- Environment variables for easy testing

### Test Categories
1. **Authentication Tests**: Registration, login, verification
2. **Service Management**: CRUD operations for services
3. **Order Processing**: Complete order lifecycle
4. **Payment Integration**: eSewa payment flow
5. **Branch Operations**: Branch and manager management
6. **Accounting Reports**: Financial data retrieval

### Running Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test users
python manage.py test payments

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

## Error Handling

### API Response Format
```json
{
    "success": true/false,
    "message": "Description of result",
    "data": {},  // Response data
    "error": ""  // Error details if applicable
}
```

### Common Error Codes
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `500`: Internal Server Error - Server-side error

## Security Considerations

1. **Environment Variables**: Sensitive data in `.env` file
2. **JWT Tokens**: Secure token-based authentication
3. **CORS Configuration**: Restricted cross-origin requests
4. **Payment Security**: Signature verification for payments
5. **Input Validation**: Django REST Framework serializers
6. **SQL Injection Protection**: Django ORM usage

## Future Enhancements

1. **Database Migration**: Move to PostgreSQL for production
2. **Caching**: Implement Redis for performance
3. **File Storage**: Add image upload for services/users
4. **Notifications**: Real-time notifications system
5. **API Documentation**: Swagger/OpenAPI integration
6. **Monitoring**: Application performance monitoring
7. **Testing**: Increase test coverage to 90%+

## Architecture Decisions

### Why Django REST Framework?
- Rapid API development
- Built-in authentication and permissions
- Excellent serialization capabilities
- Strong community support

### Why JWT Authentication?
- Stateless authentication
- Frontend-friendly token format
- Scalable across multiple services
- Secure with proper implementation

### Why SQLite for Development?
- Zero configuration
- Perfect for development and testing
- Easy database inspection and debugging
- Simple migration to PostgreSQL

This documentation provides a comprehensive overview of the Laundry Management System backend. For specific implementation details, refer to the individual module files and their respective docstrings.