import { UserRole } from '../contexts/AuthContext';

// Define page permissions for each role
export interface PagePermissions {
  [key: string]: UserRole[];
}

export const PAGE_PERMISSIONS: PagePermissions = {
  // Admin has access to everything
  '/dashboard': ['admin', 'branch_manager', 'accountant'],
  '/branch': ['admin', 'branch_manager'],
  '/orders': ['admin', 'branch_manager', 'rider'],
  '/place-orders': ['admin', 'branch_manager'], // Staff can place orders for customers
  '/income': ['admin', 'accountant'],
  '/expenses': ['admin', 'accountant'],
  '/clients': ['admin', 'branch_manager'],
  '/payments': ['admin', 'branch_manager', 'accountant'],
  '/roles': ['admin'], // Only admin can manage roles
  '/backup-export': ['admin'],
  '/delivery': ['admin', 'branch_manager', 'rider'],
  '/profile': ['admin', 'branch_manager', 'accountant', 'rider'], // Staff profile

  // Customer-specific pages
  '/customer/dashboard': ['customer'],
  '/customer/orders': ['customer'],
  '/customer/profile': ['customer'],
  '/customer/place-order': ['customer'],
  '/customer/payment': ['customer'],
  '/customer/payment-history': ['customer'],
};

// Customer accessible pages (these are the only pages customers can access)
export const CUSTOMER_PAGES = [
  '/customer/dashboard',
  '/customer/orders',
  '/customer/profile',
  '/customer/place-order',
  '/customer/payment',
  '/customer/payment-history'
];

// Public pages that don't require authentication
export const PUBLIC_PAGES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email'
];

/**
 * Check if a user role has permission to access a specific page
 */
export function hasPagePermission(userRole: UserRole | null, path: string): boolean {
  if (!userRole) return false;

  // Check if it's a public page
  if (PUBLIC_PAGES.some(page => path.startsWith(page))) {
    return true;
  }

  // Find the most specific matching route
  const matchingRoute = Object.keys(PAGE_PERMISSIONS)
    .filter(route => path.startsWith(route))
    .sort((a, b) => b.length - a.length)[0]; // Get the longest matching route

  if (!matchingRoute) {
    return false;
  }

  return PAGE_PERMISSIONS[matchingRoute].includes(userRole);
}

/**
 * Get the default redirect path for a user role
 */
export function getDefaultRedirectPath(userRole: UserRole): string {
  switch (userRole) {
    case 'customer':
      return '/customer/dashboard';
    case 'rider':
      return '/delivery';
    case 'accountant':
      return '/income';
    case 'branch_manager':
      return '/dashboard';
    case 'admin':
      return '/dashboard';
    default:
      return '/login';
  }
}

/**
 * Check if the user should be redirected based on their role and current path
 */
export function shouldRedirect(userRole: UserRole | null, currentPath: string): string | null {
  if (!userRole) return '/login';

  // If user doesn't have permission to current page, redirect to their default page
  if (!hasPagePermission(userRole, currentPath)) {
    return '/login';
  }

  return null;
}
