"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { canAccessPage, getPagePermissions, getRolePermissions } from '../utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'branch_manager' | 'accountant' | 'rider' | 'customer'>;
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requiredPermissions,
  fallbackPath = '/unauthorized'
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        const params = new URLSearchParams({
          redirect: pathname,
          action: 'access this page'
        });
        router.push(`/login?${params.toString()}`);
        return;
      }

      if (user) {
        let hasAccess = true;
        let denialReason = '';
        let requiredRole = '';

        // Check role-based access
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          hasAccess = false;
          denialReason = 'role-based access';
          requiredRole = allowedRoles[0];
        }

        // Check permission-based access
        if (hasAccess && requiredPermissions) {
          const userPermissions = user.role ? getRolePermissions(user.role) : [];
          
          const hasRequiredPermissions = requiredPermissions.some(permission => 
            userPermissions.includes(permission)
          );
          
          if (!hasRequiredPermissions) {
            hasAccess = false;
            denialReason = 'insufficient permissions';
          }
        }

        // Check page-specific permissions if no explicit permissions provided
        if (hasAccess && !requiredPermissions && !allowedRoles) {
          hasAccess = canAccessPage(user.role, pathname);
          if (!hasAccess) {
            denialReason = 'page access denied';
          }
        }

        if (!hasAccess) {
          const params = new URLSearchParams({
            action: `access ${pathname}`,
            reason: denialReason,
            current_role: user.role,
            user_name: `${user.first_name} ${user.last_name}`,
            required_permissions: requiredPermissions?.join(',') || getPagePermissions(pathname).join(',')
          });

          if (requiredRole) {
            params.set('required_role', requiredRole);
          }

          router.push(`${fallbackPath}?${params.toString()}`);
          return;
        }
      }
    }
  }, [isAuthenticated, isLoading, user, router, allowedRoles, requiredPermissions, pathname, fallbackPath]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Loading...</h2>
          <p className="mt-2 text-gray-600">Checking permissions</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
