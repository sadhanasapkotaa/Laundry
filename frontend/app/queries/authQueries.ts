import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { setTokens, clearTokens, getAccessToken } from './api';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  User,
  ApiError,
} from '../types/auth';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

// Auth API functions
const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    console.log('Login request data:', data);
    console.log('API base URL:', api.defaults.baseURL);
    try {
      const response = await api.post('/auth/login/', data);
      console.log('Login response:', response.data);
      return response.data;
    } catch (error: unknown) {
      const errorResponse = error && typeof error === 'object' && 'response' in error 
        ? error as { response?: { status?: number; statusText?: string; data?: unknown; headers?: unknown }; config?: { url?: string; method?: string; data?: unknown; headers?: unknown } }
        : null;
      console.error('Login error details:', {
        status: errorResponse?.response?.status,
        statusText: errorResponse?.response?.statusText,
        data: errorResponse?.response?.data,
        headers: errorResponse?.response?.headers,
        config: {
          url: errorResponse?.config?.url,
          method: errorResponse?.config?.method,
          data: errorResponse?.config?.data,
          headers: errorResponse?.config?.headers,
        }
      });
      throw error instanceof Error ? error : new Error('Login failed');
    }
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  verifyOTP: async (data: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
    const response = await api.post('/auth/verify/', data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    const response = await api.post('/auth/password-reset/', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    const { uid64, token, ...resetData } = data;
    const response = await api.post(`/auth/password-reset-confirm/${uid64}/${token}/`, resetData);
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    const response = await api.post('/auth/set-new-password/', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/logout/');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    const response = await api.patch('/auth/update-profile/', data);
    return response.data;
  },
};

// Custom hooks
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Store tokens
      setTokens(data.access_token, data.refresh_token);
      
      // Create user object from login response
      const user: User = {
        id: '', // We'll get this from profile endpoint
        email: data.email,
        first_name: data.full_name.split(' ')[0] || '',
        last_name: data.full_name.split(' ').slice(1).join(' ') || '',
        phone: data.phone,
        role: data.role as User['role'], // Use role from login response
        is_verified: true, // Assuming verified if they can login
        is_active: true,
        date_joined: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };
      
      // Update user cache
      queryClient.setQueryData(authKeys.user(), user);
      
      // Invalidate auth queries to fetch fresh profile data
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      console.error('Login error:', error);
      clearTokens();
    },
  });
};

export const useRegister = () => {
  return useMutation<RegisterResponse, ApiError, RegisterRequest>({
    mutationFn: authApi.register,
    onError: (error) => {
      console.error('Registration error:', error);
    },
  });
};

export const useVerifyOTP = () => {
  const queryClient = useQueryClient();

  return useMutation<VerifyOTPResponse, ApiError, VerifyOTPRequest>({
    mutationFn: authApi.verifyOTP,
    onSuccess: (data) => {
      console.log('OTP verification successful:', data);
      // Just invalidate queries, don't set user data
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      console.error('OTP verification error:', error);
    },
  });
};

export const useForgotPassword = () => {
  return useMutation<ForgotPasswordResponse, ApiError, ForgotPasswordRequest>({
    mutationFn: authApi.forgotPassword,
    onError: (error) => {
      console.error('Forgot password error:', error);
    },
  });
};

export const useResetPassword = () => {
  return useMutation<ResetPasswordResponse, ApiError, ResetPasswordRequest>({
    mutationFn: authApi.resetPassword,
    onError: (error) => {
      console.error('Reset password error:', error);
    },
  });
};

export const useChangePassword = () => {
  return useMutation<ChangePasswordResponse, ApiError, ChangePasswordRequest>({
    mutationFn: authApi.changePassword,
    onError: (error) => {
      console.error('Change password error:', error);
    },
  });
};

export const useProfile = () => {
  return useQuery<User, ApiError>({
    queryKey: authKeys.profile(),
    queryFn: authApi.getProfile,
    enabled: !!getAccessToken(),
    staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
      // Don't retry on 401 errors
      const errWithResp = error as { response?: { status?: number } } | undefined;
      if (errWithResp?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, ApiError, void>({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear tokens
      clearTokens();
      
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
    onError: (error) => {
      console.error('Logout error:', error);
      
      // Clear tokens even if logout fails
      clearTokens();
      queryClient.clear();
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
  });
};

// Helper hook to check authentication status
export const useAuth = () => {
  const { data: user, isLoading, error } = useProfile();
  const hasToken = !!getAccessToken();

  return {
    user,
    isAuthenticated: hasToken && !!user && !error,
    isLoading: hasToken ? isLoading : false,
    error,
  };
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, ApiError, UpdateProfileRequest>({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      // Update user cache with new data
      queryClient.setQueryData(authKeys.user(), data.data);
      queryClient.setQueryData(authKeys.profile(), data.data);
      
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      console.error('Profile update error:', error);
    },
  });
};
