"""Views for user management including registration, login, password reset, and email verification."""
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import smart_str, DjangoUnicodeDecodeError
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from .serializers import (UserRegisterSerializer, UserLoginSerializer,
                        PasswordResetSerializer, SetNewPasswordSerializer,
                        PasswordResetConfirmSerializer, LogoutUserSerializer,
                        VerifyUserEmailSerializer, UpdateProfileSerializer)
from .models import User, OneTimePassword
from .utils import send_code_to_user
from .utils import generate_otp
# Create your views here.
# from django.core.exceptions import ObjectDoesNotExist.DoesNotExist

class RegisterUserView(GenericAPIView):
    """
    View for user registration.
    Allows any user to register with default customer role.
    No authentication required.
    """
    serializer_class = UserRegisterSerializer
    permission_classes = []  # Allow any user to register
    authentication_classes = []  # No authentication required

    def post(self, request):
        """
        Handle user registration request.
        Args:
            request: HTTP request object containing user data
            
        Returns:
            Response with user data and success message or error details
        """
        user_data=request.data
        serializer=self.serializer_class(data=user_data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            user=serializer.data
            # send email function to user['email]
            send_code_to_user(user['email'])
            return Response(
                {
                    'data': user,
                    'message': 'User Created Successfully. Check your email to verify your account',
                }, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyUserEmail(GenericAPIView):
    """View for verifying user email with OTP."""
    serializer_class = VerifyUserEmailSerializer  # assuming you defined this


    def post(self, request):
        """Handle email verification request with OTP."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp_code = serializer.validated_data['otp']  # Changed from otp_code to otp


        try:
            # pylint: disable=no-member
            user_code_obj = OneTimePassword.objects.get(code=otp_code)
            user = user_code_obj.user

            if not user.is_verified:
                user.is_verified = True
                user.save()
                return Response({'message': 'Email Verified Successfully'}, 
                status=status.HTTP_200_OK)
            return Response({'message': 'Email already verified.'}, status=status.HTTP_200_OK)

        except OneTimePassword.DoesNotExist:
            # User entered invalid code - regenerate and send a new OTP
            email = request.data.get('email')
            try:
                user = User.objects.get(email=email)
                new_code = generate_otp()

                # Update existing OTP or create a new one
                otp_obj, created = OneTimePassword.objects.get_or_create(user=user)
                otp_obj.code = new_code
                otp_obj.save()

                send_code_to_user(user.email)  # Send the new OTP via email

                return Response(
                    {
                        'message': 'Invalid code. A new OTP has been sent to your email.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            except User.DoesNotExist:
                return Response({'message': 'User does not exist for the provided email.'}, status=status.HTTP_404_NOT_FOUND)


class LoginUserView(GenericAPIView):
    """
    View for user login.
    """
    serializer_class= UserLoginSerializer
    def post(self, request):
        """
        Handle user login request.
        
        Args:
            request: HTTP request object containing login credentials
            
        Returns:
            Response with access token and user details or error message
        """
        serializer=self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class TestAuthenticationView(GenericAPIView):
    """
    Test view for authenticated users.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def get(self, request):
        """
        Test authenticated access.
        
        Args:
            request: HTTP request object
            
        Returns:
            Response with user data
        """
        user = request.user
        data = {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'role': user.role,
            'is_verified': user.is_verified,
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
        }
        return Response(data, status=status.HTTP_200_OK)
    

class PasswordResetRequestView(GenericAPIView):
    """
    View for handling password reset requests.
    """
    serializer_class = PasswordResetSerializer

    def post(self, request):
        """
        Handle password reset request.
        
        Args:
            request: HTTP request object containing email
            
        Returns:
            Response with success or error message
        """
        serializer = self.serializer_class(data=request.data, context = {'request': request})
        serializer.is_valid(raise_exception=True)
        return Response(
            {'message': 'Password reset link sent to your email'}, status=status.HTTP_200_OK
        )
    
class PasswordResetConfirmView(GenericAPIView):
    """
    View for confirming password reset with token.
    """
    serializer_class = PasswordResetConfirmSerializer

    def get(self, request, uid64, token):
        """
        Validate the password reset token.
        
        Args:
            request: HTTP request object
            uid64: URL-safe base64 encoded user ID
            token: Password reset token
            
        Returns:
            Response with token validity status
        """
        try:
            user_id = smart_str(urlsafe_base64_decode(uid64))
            user = User.objects.get(id=user_id)
            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response(
                    {'message': 'Token is invalid or expired'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response({
                'success': True,
                'message': 'Token is valid',
                'uid64': uid64,
                'token': token
            }, status=status.HTTP_200_OK)
        
        except DjangoUnicodeDecodeError:
            return Response(
                {'message': 'Token is invalid or expired'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
class SetNewPassword(GenericAPIView):
    """
    View for setting a new password after password reset confirmation.
    Requires a valid token and uid to process the password reset.
    """
    serializer_class = SetNewPasswordSerializer
    permission_classes = []  # Public access for password reset
    
    def patch(self, request):
        """
        Handle password reset with new password.
        
        Args:
            request: HTTP request object containing new password and token data
            
        Returns:
            Response with success message or error details
        """
        try:
            serializer = self.serializer_class(data=request.data)
            serializer.is_valid(raise_exception=True)
            return Response(
                {
                    'success': True,
                    'message': 'Password reset successfully'
                }, status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {
                    'success': False,
                    'message': 'Password reset failed',
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST
            )

class LogoutUserView(GenericAPIView):
    """
    View for handling user logout.
    Requires valid JWT authentication and invalidates the token.
    """
    serializer_class = LogoutUserSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def post(self, request):
        """
        Handle user logout request.
        
        Args:
            request: HTTP request object containing the auth token
            
        Returns:
            Response with no content on successful logout
        """
        try:
            serializer = self.serializer_class(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(
                {
                    'success': True,
                    'message': 'Logged out successfully'
                }, status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {
                    'success': False,
                    'message': 'Logout failed',
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST
            )

class UpdateProfileView(GenericAPIView):
    """
    View for updating user profile.
    Requires authentication.
    """
    serializer_class = UpdateProfileSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def patch(self, request):
        """
        Handle profile update request.
        
        Args:
            request: HTTP request object containing updated profile data
            
        Returns:
            Response with updated user data or error details
        """
        try:
            user = request.user
            serializer = self.serializer_class(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            # Return updated user data
            updated_data = {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'role': user.role,
                'is_verified': user.is_verified,
                'is_active': user.is_active,
                'date_joined': user.date_joined.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
            }
            
            return Response(
                {
                    'success': True,
                    'message': 'Profile updated successfully',
                    'data': updated_data
                }, status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {
                    'success': False,
                    'message': 'Profile update failed',
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST
            )