"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth as useAuthQuery, useLogout } from '../queries/authQueries';

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
  last_login: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: any;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading, error } = useAuthQuery();
  const { mutate: logoutMutation } = useLogout();

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const logout = () => {
    logoutMutation();
  };

  const value: AuthContextType = {
    user: user || null,
    isAuthenticated,
    isLoading,
    error,
    hasRole,
    hasAnyRole,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
