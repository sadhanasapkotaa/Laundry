"""
Management command to backfill income records for existing completed payments.
This ensures all completed payments are properly reflected in branch income.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from payments.models import Payment
from accounting.models import Income, IncomeCategory
from orders.models import OrderPayment


class Command(BaseCommand):
    help = 'Backfill income records for existing completed payments'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating records',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Get or create income category for payments
        if not dry_run:
            category, created = IncomeCategory.objects.get_or_create(
                name='Payment Income',
                defaults={'name': 'Payment Income'}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created income category: Payment Income'))
        else:
            category = IncomeCategory.objects.filter(name='Payment Income').first()
            if not category:
                self.stdout.write(self.style.WARNING('Income category "Payment Income" does not exist (would be created)'))

        # Find all completed payments without income records
        completed_payments = Payment.objects.filter(
            status='COMPLETE',
            income_record__isnull=True
        ).select_related('branch')

        total_count = completed_payments.count()
        self.stdout.write(f'Found {total_count} completed payments without income records')

        if total_count == 0:
            self.stdout.write(self.style.SUCCESS('No payments need backfilling!'))
            return

        created_count = 0
        skipped_count = 0

        for payment in completed_payments:
            try:
                # Calculate the amount to record as income
                order_payments = OrderPayment.objects.filter(payment=payment)
                total_applied = sum(op.amount_applied for op in order_payments)
                
                # If no order payments exist, this is an advance payment
                if not order_payments.exists():
                    total_applied = payment.total_amount
                
                # Skip if no branch or no amount
                if not payment.branch or total_applied <= 0:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Skipping payment {payment.transaction_uuid}: '
                            f'Branch={payment.branch}, Amount={total_applied}'
                        )
                    )
                    skipped_count += 1
                    continue

                if dry_run:
                    self.stdout.write(
                        f'Would create income: Branch={payment.branch.name}, '
                        f'Amount={total_applied}, Payment={payment.transaction_uuid}'
                    )
                    created_count += 1
                else:
                    # Create income record
                    with transaction.atomic():
                        income = Income.objects.create(
                            branch=payment.branch,
                            category=category,
                            amount=total_applied,
                            description=f"Income from payment {payment.transaction_uuid}",
                            date_received=payment.processed_at.date() if payment.processed_at else timezone.now().date()
                        )
                        
                        # Link the income record to the payment
                        payment.income_record = income
                        payment.save(update_fields=['income_record'])
                        
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'Created income record {income.id} for payment {payment.transaction_uuid} '
                                f'(Branch: {payment.branch.name}, Amount: Rs.{total_applied})'
                            )
                        )
                        created_count += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error processing payment {payment.transaction_uuid}: {str(e)}'
                    )
                )

        # Summary
        self.stdout.write('\n' + '='*60)
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f'DRY RUN COMPLETE'))
            self.stdout.write(f'Would create: {created_count} income records')
        else:
            self.stdout.write(self.style.SUCCESS(f'BACKFILL COMPLETE'))
            self.stdout.write(f'Created: {created_count} income records')
        self.stdout.write(f'Skipped: {skipped_count} payments')
        self.stdout.write('='*60)
