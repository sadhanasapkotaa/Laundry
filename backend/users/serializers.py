from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.urls import reverse
from django.contrib.sites.shortcuts import get_current_site
from django.utils.encoding import smart_bytes, force_str
from .utils import send_normal_email
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from .models import Role
from django.core.exceptions import ObjectDoesNotExist


class UserRegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(max_length=68, min_length=6, write_only=True)
    password2 = serializers.CharField(max_length=68, min_length=6, write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'password', 'password2']
        extra_kwargs = {
            'email': {
                'error_messages': {
                    'unique': 'Email already exists.'
                }
            }
        }

    def validate(self, attrs):
        """Validate registration data."""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError('Passwords do not match')
        return attrs

    def create(self, validated_data):
        """Create a new user with the validated data."""
        # Remove password2 as it's only for validation
        validated_data.pop('password2')
        
        # Ensure role is set to customer (use string value, not enum)
        validated_data['role'] = Role.CUSTOMER.value  # 'customer' string

        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user



class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    email = serializers.EmailField(max_length=255, min_length=3)
    password = serializers.CharField(max_length=68, min_length=6, write_only=True)
    full_name = serializers.CharField(max_length=255, read_only=True)
    role = serializers.CharField(max_length=20, read_only=True)
    phone = serializers.CharField(max_length=20, read_only=True)
    access_token = serializers.CharField(max_length=255, read_only=True)
    refresh_token = serializers.CharField(max_length=255, read_only=True)

    def validate(self, attrs):
        """Validate user credentials and return tokens."""
        email = attrs.get('email')
        password = attrs.get('password')
        request = self.context.get('request')
        user = authenticate(request, email=email, password=password)
        if not user:
            raise AuthenticationFailed('Invalid credentials, try again')

        if not user.is_verified:
            raise AuthenticationFailed('Account is not verified')


        user_tokens = user.tokens()
        return {
            'email': user.email,
            'full_name': user.get_full_name(),
            'role': user.role,
            'phone': user.phone,
            'access_token': str(user_tokens.get('access')),
            'refresh_token': str(user_tokens.get('refresh'))
        }

class PasswordResetSerializer(serializers.ModelSerializer):
    """Serializer for password reset requests."""
    email = serializers.EmailField(max_length=255, min_length=3)
    class Meta:
        """Meta class for Password reset serializer."""
        model = User
        fields = ['email']

    def validate(self, attrs):
        """Validate the email and send a password reset link."""
        email = attrs.get('email')
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            uid64 = urlsafe_base64_encode(smart_bytes(user.id))
            token = PasswordResetTokenGenerator().make_token(user)
            request = self.context.get('request')
            site_domain = get_current_site(request).domain
            relative_link = reverse('password_reset_confirm', kwargs={'uid64': uid64, 'token': token})
            absurl = f"http://{site_domain}{relative_link}"
            email_body = f"Hello {user.first_name},\nUse the link below to reset your password:\n{absurl}"
            data = {
                'email_body': email_body,
                'to_email': user.email,
                'email_subject': 'Reset your password'
            }
            send_normal_email(data)
            return attrs
        raise serializers.ValidationError('User with this email does not exist')

class SetNewPasswordSerializer(serializers.ModelSerializer):
    """Serializer for setting a new password."""
    password = serializers.CharField(max_length=100, min_length=6, write_only=True)
    confirm_password = serializers.CharField(max_length=100, min_length=6, write_only=True)
    uidb64 = serializers.CharField(write_only=True)
    token = serializers.CharField(write_only=True)
    
    class Meta:
        """Meta class for Set New Password serializer."""
        model = User
        fields = ['password', 'confirm_password', 'uidb64', 'token']

    def validate(self, attrs):
        try:
            token = attrs.get('token')
            uidb64 = attrs.get('uidb64')
            password = attrs.get('password')
            confirm_password = attrs.get('confirm_password')

            if password != confirm_password:
                raise serializers.ValidationError({'error': 'Passwords do not match'})

            user_id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=user_id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                raise serializers.ValidationError({'error': 'Reset link is invalid or expired'})

            user.set_password(password)
            user.save()
            return attrs

        except (TypeError, ValueError, ObjectDoesNotExist):
            """Handle cases where the user does not exist or the token is invalid."""
            raise serializers.ValidationError({'error': 'Invalid reset link'})
            raise serializers.ValidationError({'error': 'Invalid reset link'})
            
class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming password reset with token."""
    token = serializers.CharField(min_length=1, write_only=True)
    uid64 = serializers.CharField(min_length=1, write_only=True)

    class Meta:
        """Meta class for Password Reset Confirm serializer."""
        fields = ['uid64', 'token']

    def validate(self, attrs):
        """Validate the token and uid for password reset confirmation."""
        return attrs

class LogoutUserSerializer(serializers.Serializer):
    """Serializer for user logout."""
    refresh_token = serializers.CharField(max_length=255, min_length=1, write_only=True)

    default_error_messages = {
        'bad_token': 'Token is invalid or expired'
    }

    class Meta:
        """Meta class for Logout User serializer."""
        fields = ['refresh_token']

    def validate(self, attrs):
        """Validate the refresh token."""
        self.token = attrs.get('refresh_token')
        return attrs

    def save(self, **kwargs):
        """Blacklist the refresh token to log out the user."""
        try:
            token = RefreshToken(self.token)
            token.blacklist()
            return True
        except TokenError:
            return super().fail('bad_token')

class VerifyUserEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

    def validate(self, attrs):
        """Validate the OTP and email."""
        return attrs

class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone']
        
    def validate_email(self, value):
        """Ensure email remains unique when updating."""
        user = self.instance
        if user and User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

class UserListSerializer(serializers.ModelSerializer):
    """Serializer for listing users (e.g., riders)."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone', 'role', 'is_active']
