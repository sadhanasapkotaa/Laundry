# Authentication Setup Documentation

This document explains the complete authentication flow setup for the Laundry Management System frontend using TanStack Query.

## Overview

The authentication system connects the Next.js frontend with the Django backend using JWT tokens, with automatic token refresh and role-based access control.

## Architecture

### Frontend Structure
```
app/
├── components/
│   ├── ClientProviders.tsx    # Query and Auth providers
│   ├── QueryProvider.tsx      # TanStack Query setup
│   └── ProtectedRoute.tsx     # Route protection component
├── contexts/
│   └── AuthContext.tsx        # Authentication context
├── queries/
│   ├── api.ts                 # Axios configuration with interceptors
│   └── authQueries.ts         # Authentication API calls
├── types/
│   └── auth.ts                # TypeScript types
└── (public)/                  # Public routes (login, signup, etc.)
    ├── login/
    ├── signup/
    ├── verify-otp/
    ├── forgot-password/
    └── change-password/
```

## Features

### 1. Authentication Pages
- **Login**: Email/password authentication
- **Signup**: User registration with email verification
- **OTP Verification**: Email verification using OTP
- **Forgot Password**: Password reset via email
- **Change Password**: Authenticated users can change passwords

### 2. Authentication Flow
1. User registers → OTP sent to email
2. User verifies OTP → Account activated
3. User logs in → JWT tokens issued
4. Tokens stored in localStorage
5. API requests include Bearer token
6. Automatic token refresh on expiry

### 3. Role-Based Access Control
Supports user roles:
- `admin`: Full system access
- `branch_manager`: Branch-specific management
- `accountant`: Financial operations
- `rider`: Pickup/delivery operations
- `customer`: Order placement and tracking

### 4. Protected Routes
```tsx
<ProtectedRoute allowedRoles={['admin', 'branch_manager']}>
  <AdminPanel />
</ProtectedRoute>
```

## API Configuration

### Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend Endpoints
The frontend expects these Django endpoints:
- `POST /auth/login/` - User login
- `POST /auth/register/` - User registration
- `POST /auth/verify/` - OTP verification
- `POST /auth/password-reset/` - Forgot password
- `POST /auth/password-reset-confirm/{uid64}/{token}/` - Reset password
- `POST /auth/set-new-password/` - Change password
- `GET /auth/profile/` - Get user profile
- `POST /auth/logout/` - User logout
- `POST /auth/refresh/` - Refresh JWT token

## Usage Examples

### 1. Login Form
```tsx
import { useLogin } from '../../queries/authQueries';

const LoginPage = () => {
  const { mutate: login, isPending, error } = useLogin();
  
  const handleSubmit = (formData) => {
    login(formData, {
      onSuccess: () => router.push('/dashboard'),
      onError: (error) => console.error(error),
    });
  };
  
  // Form JSX...
};
```

### 2. Authentication Check
```tsx
import { useAuth } from '../contexts/AuthContext';

const Component = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginPrompt />;
  
  return <AuthenticatedContent user={user} />;
};
```

### 3. Role-Based Rendering
```tsx
const Dashboard = () => {
  const { hasRole, hasAnyRole } = useAuth();
  
  return (
    <div>
      {hasRole('admin') && <AdminSection />}
      {hasAnyRole(['admin', 'branch_manager']) && <ManagementSection />}
      <GeneralSection />
    </div>
  );
};
```

## Security Features

### 1. Token Management
- Access tokens stored in localStorage
- Refresh tokens for automatic renewal
- Tokens cleared on logout/errors

### 2. Request Interceptors
- Automatic Bearer token inclusion
- Token refresh on 401 errors
- Logout on refresh failure

### 3. Route Protection
- Authentication checks on protected routes
- Role-based access control
- Automatic redirects for unauthorized access

## Error Handling

### 1. API Errors
```tsx
const { mutate, error } = useLogin();

// Display error messages
{error && (
  <div className="text-red-600">
    {error.message || error.error || 'Login failed'}
  </div>
)}
```

### 2. Network Errors
- Automatic retry on network failures
- Loading states during requests
- Graceful degradation

## State Management

### 1. TanStack Query
- Server state management
- Automatic caching and sync
- Background refetching
- Optimistic updates

### 2. Query Keys
```tsx
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};
```

## Development Setup

### 1. Install Dependencies
```bash
npm install @tanstack/react-query axios
```

### 2. Wrap App with Providers
```tsx
// app/layout.tsx
import ClientProviders from './components/ClientProviders';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
```

### 3. Environment Setup
Create `.env.local` with your API URL

### 4. Start Development
```bash
npm run dev
```

## Testing Authentication

### 1. Test User Registration
1. Go to `/signup`
2. Fill form and submit
3. Check email for OTP
4. Go to `/verify-otp` with email parameter
5. Enter OTP and verify

### 2. Test Login Flow
1. Go to `/login`
2. Enter credentials
3. Should redirect to `/dashboard`
4. Check network tab for API calls

### 3. Test Protected Routes
1. Access `/dashboard` without auth → redirect to login
2. Login and access `/dashboard` → should work
3. Try role-specific pages

## Common Issues

### 1. CORS Errors
Ensure Django backend has CORS configured:
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

### 2. Token Refresh Issues
Check Django JWT settings and token lifetimes

### 3. Route Protection
Ensure `ProtectedRoute` wraps sensitive components

## Future Enhancements

1. **Remember Me**: Persistent login option
2. **Session Management**: Active session tracking
3. **Social Auth**: Google/Facebook login
4. **2FA**: Two-factor authentication
5. **Audit Logging**: User activity tracking

This authentication system provides a robust foundation for user management with proper security, error handling, and user experience considerations.
