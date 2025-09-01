from django.urls import path
from .views import RegisterUserView, VerifyUserEmail, LoginUserView, TestAuthenticationView, PasswordResetRequestView, PasswordResetConfirmView, SetNewPassword, LogoutUserView, UpdateProfileView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('verify/', VerifyUserEmail.as_view(), name='verify'),
    path('login/', LoginUserView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', TestAuthenticationView.as_view(), name='profile'),
    path('update-profile/', UpdateProfileView.as_view(), name='update_profile'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset-confirm/<str:uid64>/<str:token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('set-new-password/', SetNewPassword.as_view(), name='set_new_password'),
    path('logout/', LogoutUserView.as_view(), name='logout'),
]