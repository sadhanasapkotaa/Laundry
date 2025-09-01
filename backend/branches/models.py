"""This file contains the Branch and BranchManager models for the laundry service application."""
from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()

class Branch(models.Model):
    """Model representing a branch of the laundry service."""
    name = models.CharField(max_length=100)
    branch_id = models.CharField(max_length=10, unique=True, blank=True)
    branch_manager = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    # Map location link
    map_link = models.URLField(max_length=500, blank=True, null=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(max_length=255)
    status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('inactive', 'Inactive')
    ], default='active')
    opening_date = models.DateField()
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        """Override save to auto-generate branch_id if not provided."""
        if not self.branch_id:
            # Get the highest existing branch number
            last_branch = Branch.objects.filter(
                branch_id__startswith='BR-'
            ).order_by('-branch_id').first()
            
            if last_branch and last_branch.branch_id:
                try:
                    # Extract number from BR-XXX format
                    last_number = int(last_branch.branch_id.split('-')[1])
                    new_number = last_number + 1
                except (IndexError, ValueError):
                    new_number = 1
            else:
                new_number = 1
            
            # Generate new branch_id with zero-padding
            self.branch_id = f"BR-{new_number:03d}"
            
            # Ensure uniqueness (in case of race conditions)
            while Branch.objects.filter(branch_id=self.branch_id).exists():
                new_number += 1
                self.branch_id = f"BR-{new_number:03d}"
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.branch_id})"

    def get_branch_code(self):
        """Returns the unique branch code."""
        return f"{self.branch_id}"

    def get_branch_manager(self):
        """Returns the name of the branch manager."""
        return self.branch_manager if self.branch_manager else "No manager assigned"

    def get_total_orders(self):
        """Returns the total number of orders for this branch."""
        return self.order_set.count()

    def get_monthly_revenue(self):
        """Returns the monthly revenue for this branch."""
        from django.utils import timezone
        from django.db.models import Sum
        current_month = timezone.now().month
        current_year = timezone.now().year
        revenue = self.incomes.filter(
            date_received__month=current_month,
            date_received__year=current_year
        ).aggregate(total=Sum('amount'))['total'] or 0
        return revenue

    def get_monthly_expenses(self):
        """Returns the monthly expenses for this branch."""
        from django.utils import timezone
        from django.db.models import Sum
        current_month = timezone.now().month
        current_year = timezone.now().year
        expenses = self.expenses.filter(
            date_incurred__month=current_month,
            date_incurred__year=current_year
        ).aggregate(total=Sum('amount'))['total'] or 0
        return expenses

    def get_staff_count(self):
        """Returns the number of active staff in this branch."""
        return self.managers.filter(is_active=True).count()

class IDType(models.TextChoices):
    """Enumeration for different types of identification documents."""
    CITIZENSHIP = 'citizenship', 'Citizenship'
    NATIONAL_ID = 'national_id', 'National Id'
    DRIVERS_LICENCE = 'drivers_licence', "Driver's Licence"

class BranchManager(models.Model):
    """Branch Manager relationship model"""
    manager_id = models.CharField(max_length = 20)
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='managers')
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    hired_date = models.DateField()
    leaving_date = models.DateField()
    id_type = models.CharField(
        max_length=20,
        choices=IDType.choices,
    )
    citizenship_number = models.BigIntegerField()
    is_active = models.BooleanField(default=True)
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta for the branch managers table"""
        db_table = 'branch_managers'
