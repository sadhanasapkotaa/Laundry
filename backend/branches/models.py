"""This file contains the Branch and BranchManager models for the laundry service application."""
from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()

class Branch(models.Model):
    """Model representing a branch of the laundry service."""
    name = models.CharField(max_length=100)
    branch_id = models.CharField(max_length=10, unique=True)
    branch_manager = models.CharField(max_length=100, blank=True, null=True)
    def __str__(self):
        return f"{self.name}"

    def get_branch_code(self):
        """Returns the unique branch code."""
        return f"{self.branch_id}"

    def get_branch_manager(self):
        """Returns the name of the branch manager."""
        return self.branch_manager if self.branch_manager else "No manager assigned"

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
