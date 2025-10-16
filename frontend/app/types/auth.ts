export type UserRole = 'admin' | 'branch_manager' | 'accountant' | 'rider' | 'customer';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  access_token: string;
  refresh_token: string;
}

export interface RegisterRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  password: string;
  password2: string;
  role?: UserRole;
}

export interface RegisterResponse {
  data: {
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  message: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface VerifyOTPResponse {
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  uid64: string;
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface UpdateProfileRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface ApiError {
  error?: string;
  message?: string;
  detail?: string;
  non_field_errors?: string[];
  [key: string]: any;
}
