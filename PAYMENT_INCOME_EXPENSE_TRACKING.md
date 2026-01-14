# Payment-Income & Expense Tracking System

## Overview

This document explains how the Laundry Management System tracks branch income and expenses to ensure accurate financial reporting.

## Payment → Income Tracking

### Automatic Income Creation

Every payment that is marked as **COMPLETE** automatically generates an income record for the associated branch. This is handled by a Django signal in `backend/payments/signals.py`.

#### How It Works:

1. **Payment Processing**: When a payment status changes to `COMPLETE` and the `processed_at` timestamp is set, the signal triggers.

2. **Income Record Creation**: The signal automatically creates an `Income` record with:
   - **Branch**: The branch associated with the payment
   - **Amount**: The total payment amount (or amount applied to orders if using OrderPayment)
   - **Category**: "Payment Income" (auto-created if doesn't exist)
   - **Date**: The date the payment was processed
   - **Description**: Reference to the payment transaction UUID

3. **Link Creation**: The income record is linked back to the payment via the `income_record` field, preventing duplicate income creation.

#### Code Example:

```python
# When a payment is completed:
payment.status = 'COMPLETE'
payment.processed_at = timezone.now()
payment.save()

# Signal automatically creates:
Income.objects.create(
    branch=payment.branch,
    category=payment_income_category,
    amount=payment.total_amount,
    description=f"Income from payment {payment.transaction_uuid}",
    date_received=payment.processed_at.date()
)
```

### Backfilling Historical Data

For existing completed payments that don't have income records, use the management command:

```bash
# Dry run to see what would be created
python manage.py backfill_payment_income --dry-run

# Actually create the income records
python manage.py backfill_payment_income
```

## Expense Tracking

### Manual Expense Entry

Expenses are manually created through the accounting API and must be associated with a branch:

```python
POST /api/accounting/expenses/
{
    "branch": 1,
    "category": 2,
    "amount": 5000.00,
    "description": "Equipment maintenance",
    "date_incurred": "2024-12-14"
}
```

### Expense Categories

Common expense categories include:
- Utilities (water, electricity)
- Equipment maintenance
- Staff salaries
- Supplies (detergent, hangers, etc.)
- Rent
- Marketing

## Branch Financial Overview

### Viewing Branch Income & Expenses

#### API Endpoint:
```
GET /api/accounting/reports/branch-summary/?branch_id=1
```

#### Response:
```json
{
    "branches": [
        {
            "branch_id": 1,
            "branch_name": "Main Branch",
            "total_income": 125000.00,
            "total_expense": 45000.00,
            "net_profit": 80000.00,
            "income_records_from_payments": 45,
            "income_records_manual": 3
        }
    ],
    "total_branches": 1
}
```

### Income Breakdown

The `IncomeSerializer` includes a `payment_reference` field that shows if the income came from a payment:

```json
{
    "id": 1,
    "branch": 1,
    "branch_name": "Main Branch",
    "category": 1,
    "category_name": "Payment Income",
    "amount": 5000.00,
    "description": "Income from payment 241214-152030-abc123",
    "date_received": "2024-12-14",
    "payment_reference": {
        "transaction_uuid": "241214-152030-abc123",
        "amount": "5000.00",
        "payment_type": "esewa",
        "status": "COMPLETE"
    }
}
```

## Verification & Monitoring

### Verification Script

Run the verification script to check the integrity of payment-income tracking:

```bash
python verify_payment_income_tracking.py
```

This script checks:
- All completed payments have income records
- Income amounts match payment amounts
- Branch attribution is correct
- Identifies any mismatches or missing records

### Sample Output:
```
================================================================================
PAYMENT-INCOME TRACKING VERIFICATION
================================================================================

1. Total Completed Payments: 45
   - With Income Records: 45
   - Without Income Records: 0

   ✅ All completed payments have income records!

2. Branch Attribution Check:
   ✅ All completed payments have branches assigned!

3. Income by Branch:

   Branch: Main Branch (ID: 1)
   - Completed Payments: 30 (Total: Rs.150000)
   - Income Records: 35 (Total: Rs.155000)
     • From Payments: 30
     • Manual Entries: 5

   Branch: Downtown Branch (ID: 2)
   - Completed Payments: 15 (Total: Rs.75000)
   - Income Records: 18 (Total: Rs.80000)
     • From Payments: 15
     • Manual Entries: 3

4. Payment-Income Amount Verification:
   ✅ All payment-income amounts match!

================================================================================
SUMMARY
================================================================================
Total Completed Payments: 45
Payments with Income Records: 45
Payments without Income Records: 0
Payments without Branch: 0
Amount Mismatches: 0

✅ ALL CHECKS PASSED - Payment-Income tracking is working correctly!
================================================================================
```

## Financial Reports

### Time Period Reports

Get income and expense data for specific time periods:

```
POST /api/accounting/reports/time-period/
{
    "period": "monthly",
    "year": 2024,
    "month": 12,
    "branch_id": 1  // optional
}
```

Response:
```json
{
    "total_income": 125000.00,
    "total_expense": 45000.00,
    "net_profit": 80000.00
}
```

### Branch Insights

Compare branch performance:

```
GET /api/accounting/reports/branch-insights/
```

Response:
```json
{
    "most_profitable_branch": "Main Branch",
    "least_profitable_branch": "Downtown Branch",
    "most_expensive_branch": "Main Branch",
    "least_expensive_branch": "Downtown Branch",
    "income_by_branch": {
        "Main Branch": 155000.00,
        "Downtown Branch": 80000.00
    },
    "expenses_by_branch": {
        "Main Branch": 55000.00,
        "Downtown Branch": 30000.00
    }
}
```

## Database Schema

### Payment Model
```python
class Payment(models.Model):
    user = ForeignKey(User)
    transaction_uuid = CharField(unique=True)
    amount = DecimalField()
    total_amount = DecimalField()
    status = CharField()  # PENDING, COMPLETE, FAILED, etc.
    payment_type = CharField()  # cash, bank, esewa
    branch = ForeignKey(Branch)
    income_record = OneToOneField(Income)  # Link to income
    processed_at = DateTimeField()
    # ... other fields
```

### Income Model
```python
class Income(models.Model):
    branch = ForeignKey(Branch)
    category = ForeignKey(IncomeCategory)
    amount = DecimalField()
    description = TextField()
    date_received = DateField()
    # Reverse relation: payment (from Payment.income_record)
```

### Expense Model
```python
class Expense(models.Model):
    branch = ForeignKey(Branch)
    category = ForeignKey(ExpenseCategory)
    amount = DecimalField()
    description = TextField()
    date_incurred = DateField()
```

## Best Practices

1. **Always Set Branch**: Ensure every payment has a branch assigned before marking it as COMPLETE.

2. **Regular Verification**: Run the verification script regularly to ensure data integrity.

3. **Expense Categories**: Create meaningful expense categories that align with your business operations.

4. **Manual Income**: If you receive income outside of the payment system, create manual income records with appropriate categories.

5. **Reconciliation**: Regularly reconcile income records with completed payments to ensure nothing is missed.

## Troubleshooting

### Missing Income Records

If completed payments are missing income records:

1. Check if the payment has a branch assigned
2. Check if the payment status is 'COMPLETE'
3. Check if `processed_at` is set
4. Run the backfill command: `python manage.py backfill_payment_income`

### Amount Mismatches

If income amounts don't match payment amounts:

1. Check for OrderPayment records (payments split across multiple orders)
2. Verify the payment amount vs. amount applied to orders
3. Check for manual adjustments to income records

### Signal Not Triggering

If the signal isn't creating income records:

1. Verify `payments.signals` is imported in `payments/apps.py`
2. Check that `PaymentsConfig` is in `INSTALLED_APPS`
3. Look for errors in the Django logs

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/accounting/income/` | GET, POST | List/Create income records |
| `/api/accounting/expenses/` | GET, POST | List/Create expense records |
| `/api/accounting/reports/branch-summary/` | GET | Branch financial summary |
| `/api/accounting/reports/time-period/` | POST | Time-based financial report |
| `/api/accounting/reports/branch-insights/` | GET | Branch comparison insights |

## Future Enhancements

Potential improvements to consider:

1. **Automated Expense Tracking**: Create expenses from specific events (e.g., equipment purchases)
2. **Budget Tracking**: Set and monitor budgets per branch
3. **Alerts**: Notify managers when expenses exceed thresholds
4. **Forecasting**: Predict future income/expenses based on historical data
5. **Tax Reporting**: Generate tax-ready reports with proper categorization
