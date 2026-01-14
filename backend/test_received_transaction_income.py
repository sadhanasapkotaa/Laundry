"""
Script to verify that income is created only from RECEIVED transactions.
This script tests:
1. Cash payments: Income created immediately (cash received on delivery)
2. eSewa payments: Income created when verified (payment received)
3. Bank payments: Income created ONLY when staff verifies (payment received)
4. Pending payments: NO income created (transaction not yet received)
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from payments.models import Payment
from accounting.models import Income
from django.utils import timezone


def test_income_from_received_transactions():
    """Verify income is only created from received (COMPLETE) transactions."""
    
    print("=" * 80)
    print("INCOME FROM RECEIVED TRANSACTIONS - VERIFICATION")
    print("=" * 80)
    
    # Test 1: Check pending payments have NO income
    print("\n1. PENDING PAYMENTS (Transaction Not Received)")
    print("-" * 80)
    pending_payments = Payment.objects.filter(status='PENDING')
    pending_with_income = pending_payments.filter(income_record__isnull=False)
    
    print(f"   Total Pending Payments: {pending_payments.count()}")
    print(f"   Pending with Income Records: {pending_with_income.count()}")
    
    if pending_with_income.exists():
        print(f"\n   ❌ ERROR: Found {pending_with_income.count()} pending payments with income!")
        print("   These should NOT have income until transaction is received:")
        for payment in pending_with_income[:5]:
            print(f"      - {payment.transaction_uuid} ({payment.payment_type}): Rs.{payment.total_amount}")
    else:
        print("   ✅ CORRECT: No pending payments have income records")
    
    # Test 2: Check completed payments HAVE income
    print("\n2. COMPLETE PAYMENTS (Transaction Received)")
    print("-" * 80)
    complete_payments = Payment.objects.filter(status='COMPLETE', processed_at__isnull=False)
    complete_without_income = complete_payments.filter(income_record__isnull=True)
    complete_with_income = complete_payments.filter(income_record__isnull=False)
    
    print(f"   Total Complete Payments: {complete_payments.count()}")
    print(f"   Complete with Income: {complete_with_income.count()}")
    print(f"   Complete without Income: {complete_without_income.count()}")
    
    if complete_without_income.exists():
        print(f"\n   ⚠️  WARNING: {complete_without_income.count()} complete payments missing income!")
        print("   These transactions were received but income not recorded:")
        for payment in complete_without_income[:5]:
            reason = "No branch" if not payment.branch else "Unknown"
            print(f"      - {payment.transaction_uuid} ({payment.payment_type}): Rs.{payment.total_amount} - {reason}")
        print("\n   Run: python manage.py backfill_payment_income")
    else:
        print("   ✅ CORRECT: All complete payments have income records")
    
    # Test 3: Break down by payment type
    print("\n3. INCOME BY PAYMENT TYPE")
    print("-" * 80)
    
    for payment_type in ['cash', 'esewa', 'bank']:
        type_complete = Payment.objects.filter(
            payment_type=payment_type,
            status='COMPLETE',
            processed_at__isnull=False
        )
        type_with_income = type_complete.filter(income_record__isnull=False)
        type_pending = Payment.objects.filter(
            payment_type=payment_type,
            status='PENDING'
        )
        
        print(f"\n   {payment_type.upper()} Payments:")
        print(f"      Pending (not received): {type_pending.count()}")
        print(f"      Complete (received): {type_complete.count()}")
        print(f"      Complete with income: {type_with_income.count()}")
        
        if type_complete.count() > 0:
            coverage = (type_with_income.count() / type_complete.count()) * 100
            status = "✅" if coverage == 100 else "⚠️"
            print(f"      {status} Coverage: {coverage:.1f}%")
    
    # Test 4: Check failed/cancelled payments have NO income
    print("\n4. FAILED/CANCELLED PAYMENTS (Transaction Not Received)")
    print("-" * 80)
    failed_payments = Payment.objects.filter(status__in=['FAILED', 'CANCELED'])
    failed_with_income = failed_payments.filter(income_record__isnull=False)
    
    print(f"   Total Failed/Cancelled: {failed_payments.count()}")
    print(f"   Failed with Income: {failed_with_income.count()}")
    
    if failed_with_income.exists():
        print(f"\n   ❌ ERROR: Found {failed_with_income.count()} failed payments with income!")
        print("   These should NOT have income (transaction not received):")
        for payment in failed_with_income[:5]:
            print(f"      - {payment.transaction_uuid} ({payment.payment_type}): Rs.{payment.total_amount}")
    else:
        print("   ✅ CORRECT: No failed/cancelled payments have income")
    
    # Test 5: Verify income amounts match
    print("\n5. INCOME AMOUNT VERIFICATION")
    print("-" * 80)
    
    complete_with_income_payments = Payment.objects.filter(
        status='COMPLETE',
        processed_at__isnull=False,
        income_record__isnull=False
    )
    
    mismatches = []
    for payment in complete_with_income_payments:
        if payment.income_record:
            if float(payment.income_record.amount) != float(payment.total_amount):
                from orders.models import OrderPayment
                order_payments = OrderPayment.objects.filter(payment=payment)
                total_applied = sum(op.amount_applied for op in order_payments)
                if not order_payments.exists():
                    total_applied = payment.total_amount
                
                if float(payment.income_record.amount) != float(total_applied):
                    mismatches.append({
                        'payment': payment.transaction_uuid,
                        'payment_amount': float(payment.total_amount),
                        'income_amount': float(payment.income_record.amount),
                        'expected_amount': float(total_applied)
                    })
    
    print(f"   Checked {complete_with_income_payments.count()} payments")
    print(f"   Mismatches found: {len(mismatches)}")
    
    if mismatches:
        print("\n   ❌ ERROR: Income amounts don't match:")
        for m in mismatches[:5]:
            print(f"      - {m['payment']}: Payment Rs.{m['payment_amount']} vs Income Rs.{m['income_amount']} (Expected: Rs.{m['expected_amount']})")
    else:
        print("   ✅ CORRECT: All income amounts match payments")
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    all_good = (
        not pending_with_income.exists() and
        not failed_with_income.exists() and
        len(mismatches) == 0
    )
    
    if all_good and complete_without_income.count() == 0:
        print("✅ EXCELLENT: Income is correctly tracked from received transactions only!")
    elif all_good:
        print("⚠️  GOOD: Logic is correct, but some complete payments need income backfill")
        print("   Run: python manage.py backfill_payment_income")
    else:
        print("❌ ISSUES FOUND: Please review the errors above")
    
    print("\nKEY POINTS:")
    print("- Income should ONLY be created when payment status = 'COMPLETE' AND processed_at is set")
    print("- This ensures income reflects RECEIVED transactions, not just initiated ones")
    print("- Cash: Received immediately (on delivery)")
    print("- eSewa: Received when verified via eSewa")
    print("- Bank: Received when staff verifies bank transfer")
    print("=" * 80)


if __name__ == '__main__':
    test_income_from_received_transactions()
