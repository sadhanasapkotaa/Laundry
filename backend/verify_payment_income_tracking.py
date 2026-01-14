"""
Script to verify payment-income tracking.
This script checks:
1. All completed payments have income records
2. Income amounts match payment amounts
3. Branch attribution is correct
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from payments.models import Payment
from accounting.models import Income
from orders.models import OrderPayment
from django.db.models import Sum, Count


def check_payment_income_tracking():
    """Verify that all completed payments have income records."""
    
    print("=" * 80)
    print("PAYMENT-INCOME TRACKING VERIFICATION")
    print("=" * 80)
    
    # 1. Count all completed payments
    completed_payments = Payment.objects.filter(status='COMPLETE')
    total_completed = completed_payments.count()
    print(f"\n1. Total Completed Payments: {total_completed}")
    
    # 2. Count completed payments WITH income records
    payments_with_income = completed_payments.filter(income_record__isnull=False)
    with_income_count = payments_with_income.count()
    print(f"   - With Income Records: {with_income_count}")
    
    # 3. Count completed payments WITHOUT income records
    payments_without_income = completed_payments.filter(income_record__isnull=True)
    without_income_count = payments_without_income.count()
    print(f"   - Without Income Records: {without_income_count}")
    
    if without_income_count > 0:
        print(f"\n   ⚠️  WARNING: {without_income_count} completed payments are missing income records!")
        print("   Run: python manage.py backfill_payment_income")
    else:
        print(f"\n   ✅ All completed payments have income records!")
    
    # 4. Check branch attribution
    print(f"\n2. Branch Attribution Check:")
    payments_without_branch = completed_payments.filter(branch__isnull=True)
    no_branch_count = payments_without_branch.count()
    
    if no_branch_count > 0:
        print(f"   ⚠️  WARNING: {no_branch_count} completed payments have no branch assigned!")
        for payment in payments_without_branch[:5]:
            print(f"      - Payment {payment.transaction_uuid}: Rs.{payment.total_amount}")
    else:
        print(f"   ✅ All completed payments have branches assigned!")
    
    # 5. Income by branch summary
    print(f"\n3. Income by Branch:")
    from branches.models import Branch
    branches = Branch.objects.filter(status='active')
    
    for branch in branches:
        # Count payments for this branch
        branch_payments = completed_payments.filter(branch=branch)
        payment_count = branch_payments.count()
        
        # Sum payment amounts
        total_payment_amount = branch_payments.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Count and sum income records
        branch_income = Income.objects.filter(branch=branch)
        income_count = branch_income.count()
        total_income = branch_income.aggregate(total=Sum('amount'))['total'] or 0
        
        # Count income from payments
        income_from_payments = branch_income.filter(payment__isnull=False).count()
        income_manual = branch_income.filter(payment__isnull=True).count()
        
        print(f"\n   Branch: {branch.name} (ID: {branch.id})")
        print(f"   - Completed Payments: {payment_count} (Total: Rs.{total_payment_amount})")
        print(f"   - Income Records: {income_count} (Total: Rs.{total_income})")
        print(f"     • From Payments: {income_from_payments}")
        print(f"     • Manual Entries: {income_manual}")
    
    # 6. Check for amount mismatches
    print(f"\n4. Payment-Income Amount Verification:")
    mismatches = []
    
    for payment in payments_with_income:
        if payment.income_record:
            # Calculate expected income amount
            order_payments = OrderPayment.objects.filter(payment=payment)
            expected_amount = sum(op.amount_applied for op in order_payments)
            
            if not order_payments.exists():
                expected_amount = payment.total_amount
            
            actual_amount = payment.income_record.amount
            
            if abs(float(expected_amount) - float(actual_amount)) > 0.01:
                mismatches.append({
                    'payment': payment.transaction_uuid,
                    'expected': expected_amount,
                    'actual': actual_amount,
                })
    
    if mismatches:
        print(f"   ⚠️  WARNING: {len(mismatches)} amount mismatches found!")
        for mismatch in mismatches[:5]:
            print(f"      - Payment {mismatch['payment']}: Expected Rs.{mismatch['expected']}, Got Rs.{mismatch['actual']}")
    else:
        print(f"   ✅ All payment-income amounts match!")
    
    # 7. Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total Completed Payments: {total_completed}")
    print(f"Payments with Income Records: {with_income_count}")
    print(f"Payments without Income Records: {without_income_count}")
    print(f"Payments without Branch: {no_branch_count}")
    print(f"Amount Mismatches: {len(mismatches)}")
    
    if without_income_count == 0 and no_branch_count == 0 and len(mismatches) == 0:
        print("\n✅ ALL CHECKS PASSED - Payment-Income tracking is working correctly!")
    else:
        print("\n⚠️  ISSUES FOUND - Please review the warnings above.")
        if without_income_count > 0:
            print("   → Run: python manage.py backfill_payment_income")
    
    print("=" * 80)


if __name__ == "__main__":
    check_payment_income_tracking()
