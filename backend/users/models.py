"""Custom User model and One-Time Password model for the application."""
from django.db import models
from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.tokens import RefreshToken
from .managers import UserManager

class Role(models.TextChoices):
    """Enumeration of user roles in the system."""
    ADMIN = 'admin', 'Admin'
    BRANCH_MANAGER = 'branch_manager', 'Branch Manager'
    RIDER = 'rider', 'Rider'
    CUSTOMER = 'customer', 'Customer'
    ACCOUNTANT = 'accountant', 'Accountant'

class User(AbstractUser, PermissionsMixin):
    """Custom User model that extends AbstractUser and PermissionsMixin."""
    username = None # remove username field
    email = models.EmailField(max_length=255, unique=True, verbose_name=_('Email Address'))
    first_name = models.CharField(max_length=100, verbose_name=_('First Name'))
    last_name = models.CharField(max_length=100, verbose_name=_('Last Name'))
    phone = models.CharField(max_length=20, verbose_name=_('Phone Number'))
    role = models.CharField(
        max_length=15,
        choices=Role.choices,
        default=Role.CUSTOMER
    )

    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'phone']

    objects = UserManager()

    def __str__(self):
        """Returns the string representation of the user."""
        return self.email

    def get_full_name(self):
        """Returns the full name of the user."""
        return f"{self.first_name} {self.last_name}"

    # @property
    def tokens(self):
        """Generates and returns JWT tokens for the user."""
        # pass
        refresh = RefreshToken.for_user(self)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }

class OneTimePassword(models.Model):
    """Model to store one-time passwords for users."""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6, unique=True)

    def __str__(self):
        """Returns the string representation of the one-time password."""
        return f"{self.user}.passcode"
