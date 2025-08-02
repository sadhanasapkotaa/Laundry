from django.contrib.auth.models import BaseUserManager
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils.translation import gettext_lazy as _

class UserManager(BaseUserManager):
    """Custom manager for User model."""
    def email_validator(self, email):
        """Validate the email address format."""
        try:
            validate_email(email)
        except ValidationError as exc:
            raise ValueError(_('Please enter a valid Email Address')) from exc

    def create_user(self, email, first_name, last_name, password, **extra_fields):
        """Create and return a user with an email, first name, last name, and password."""
        if email:
            email = self.normalize_email(email)
            self.email_validator(email)
        else:
            raise ValueError(_('The Email Address is required'))

        if not first_name:
            raise ValueError(_('The First Name is required'))

        if not last_name:
            raise ValueError(_('The Last Name is required'))

        user = self.model(email=email, first_name=first_name, last_name=last_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, first_name, last_name, password, **extra_fields):
        """Create and return a superuser with an email, first name, last name, and password."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_verified", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))

        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        user = self.create_user(email, first_name, last_name, password, **extra_fields)

        user.save(using = self._db)
        return user
