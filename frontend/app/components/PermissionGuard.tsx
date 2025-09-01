"use client";

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission, hasAnyPermission, hasAllPermissions, UserRole } from '../utils/permissions';

interface PermissionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface RequirePermissionProps extends PermissionProps {
  permission: string;
  userRole?: UserRole;
}

interface RequireAnyPermissionProps extends PermissionProps {
  permissions: string[];
  userRole?: UserRole;
}

interface RequireAllPermissionsProps extends PermissionProps {
  permissions: string[];
  userRole?: UserRole;
}

interface RequireRoleProps extends PermissionProps {
  roles: UserRole[];
}

/**
 * Render children only if user has the required permission
 */
export const RequirePermission: React.FC<RequirePermissionProps> = ({
  children,
  permission,
  userRole,
  fallback = null
}) => {
  const { user } = useAuth();
  const role = userRole || user?.role;

  if (!role || !hasPermission(role as UserRole, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Render children only if user has any of the required permissions
 */
export const RequireAnyPermission: React.FC<RequireAnyPermissionProps> = ({
  children,
  permissions,
  userRole,
  fallback = null
}) => {
  const { user } = useAuth();
  const role = userRole || user?.role;

  if (!role || !hasAnyPermission(role as UserRole, permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Render children only if user has all of the required permissions
 */
export const RequireAllPermissions: React.FC<RequireAllPermissionsProps> = ({
  children,
  permissions,
  userRole,
  fallback = null
}) => {
  const { user } = useAuth();
  const role = userRole || user?.role;

  if (!role || !hasAllPermissions(role as UserRole, permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Render children only if user has one of the required roles
 */
export const RequireRole: React.FC<RequireRoleProps> = ({
  children,
  roles,
  fallback = null
}) => {
  const { user } = useAuth();

  if (!user?.role || !roles.includes(user.role as UserRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Custom hook for permission checking
 */
export const usePermissions = () => {
  const { user } = useAuth();

  return {
    hasPermission: (permission: string) => 
      user?.role ? hasPermission(user.role as UserRole, permission) : false,
    
    hasAnyPermission: (permissions: string[]) => 
      user?.role ? hasAnyPermission(user.role as UserRole, permissions) : false,
    
    hasAllPermissions: (permissions: string[]) => 
      user?.role ? hasAllPermissions(user.role as UserRole, permissions) : false,
    
    hasRole: (roles: UserRole[]) => 
      user?.role ? roles.includes(user.role as UserRole) : false,
    
    isAdmin: () => user?.role === 'admin',
    isBranchManager: () => user?.role === 'branch_manager',
    isRider: () => user?.role === 'rider',
    isCustomer: () => user?.role === 'customer',
  };
};
