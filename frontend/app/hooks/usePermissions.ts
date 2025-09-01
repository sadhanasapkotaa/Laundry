import React from 'react';
import { useAuth } from '../queries/authQueries';
import { UserRole } from '../types/auth';

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  admin: {
    canViewAllOrders: true,
    canViewAllBranches: true,
    canViewFinancials: true,
    canManageUsers: true,
    canManageBranches: true,
    canViewReports: true,
    canManageServices: true,
    canViewPayments: true,
    canManageRiders: true,
  },
  branch_manager: {
    canViewAllOrders: false,
    canViewAllBranches: false,
    canViewFinancials: true,
    canManageUsers: false,
    canManageBranches: false,
    canViewReports: true,
    canManageServices: false,
    canViewPayments: true,
    canManageRiders: true,
  },
  accountant: {
    canViewAllOrders: true,
    canViewAllBranches: true,
    canViewFinancials: true,
    canManageUsers: false,
    canManageBranches: false,
    canViewReports: true,
    canManageServices: false,
    canViewPayments: true,
    canManageRiders: false,
  },
  rider: {
    canViewAllOrders: false,
    canViewAllBranches: false,
    canViewFinancials: false,
    canManageUsers: false,
    canManageBranches: false,
    canViewReports: false,
    canManageServices: false,
    canViewPayments: false,
    canManageRiders: false,
  },
  customer: {
    canViewAllOrders: false,
    canViewAllBranches: false,
    canViewFinancials: false,
    canManageUsers: false,
    canManageBranches: false,
    canViewReports: false,
    canManageServices: false,
    canViewPayments: false,
    canManageRiders: false,
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.admin;

// Hook to check if user has specific permission
export const usePermission = (permission: Permission): boolean => {
  const { user } = useAuth();
  
  if (!user) return false;
  
  const userRole = user.role as UserRole;
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  
  return rolePermissions?.[permission] ?? false;
};

// Hook to get all permissions for current user
export const useUserPermissions = () => {
  const { user } = useAuth();
  
  if (!user) return {};
  
  const userRole = user.role as UserRole;
  return ROLE_PERMISSIONS[userRole] || {};
};

// HOC to protect components based on permission
export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission,
  fallback?: React.ComponentType<P>
) => {
  const ProtectedComponent = (props: P) => {
    const hasPermission = usePermission(permission);
    
    if (!hasPermission) {
      if (fallback) {
        const Fallback = fallback;
        return React.createElement(Fallback, props);
      }
      return null;
    }
    
    return React.createElement(Component, props);
  };
  
  return ProtectedComponent;
};

// Helper function to check permissions without hook
export const checkPermission = (userRole: UserRole, permission: Permission): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions?.[permission] ?? false;
};

// Role display names
export const ROLE_DISPLAY_NAMES = {
  admin: 'Administrator',
  branch_manager: 'Branch Manager',
  accountant: 'Accountant',
  rider: 'Delivery Rider',
  customer: 'Customer',
} as const;
