""" Module for user-related utilities, including OTP generation and email sending. """
import random
from django.core.mail import EmailMessage
from django.conf import settings
from .models import User, OneTimePassword

def generate_otp():
    """Generate a unique one-time password (OTP) code."""
    otp = random.randint(100000, 999999)
    # pylint: disable=no-member
    if not OneTimePassword.objects.filter(code=otp).exists():
        """ Prevent multiple duplication of otps"""
        return otp

def send_code_to_user(email):
    """Send an OTP code to the user's email for verification."""
    subject = "One Time Password"
    otp_code = generate_otp()
    print(otp_code)
    user= User.objects.get(email=email)
    current_site="myAuth.com"
    email_body = f"Hi {user.first_name},\n\n Thank you for signing up on {current_site}. Your OTP is {otp_code}. Please verify your email with that. \n\nThanks for using our service.\n\nRegards,\nMyAuth Team"
    from_email = settings.DEFAULT_FROM_EMAIL
    # Create a OneTimePassword object to store the OTP code
    # pylint: disable=no-member
    if OneTimePassword.objects.filter(user=user).exists():
        OneTimePassword.objects.filter(user=user).update(code=otp_code)
    else:
        # Create a new OneTimePassword object if it doesn't exist
        OneTimePassword.objects.create(user=user, code=otp_code)
    send_email = EmailMessage(subject=subject, body=email_body, from_email=from_email, to=[email])
    send_email.send(fail_silently=True)

def send_normal_email(data):
    """Send a normal email with the provided data."""
    email = EmailMessage(
        subject=data['email_subject'],
        body=data['email_body'],
        from_email=settings.EMAIL_HOST_USER,
        to=[data['to_email']]
    )
    email.send(fail_silently=True)

# def send_email_to_user(email, subject, message):
#     email = EmailMessage(subject, message, to=[email])
#     email.send()

# def send_email_to_multiple_users(emails, subject, message):
#     email = EmailMessage(subject, message, to=emails)
