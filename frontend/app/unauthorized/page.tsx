"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { FiShield, FiLock, FiHome, FiArrowLeft, FiLogOut, FiUser } from 'react-icons/fi';

const UnauthorizedPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuth();
  const [attemptedAction, setAttemptedAction] = useState<string>('');
  const [requiredRole, setRequiredRole] = useState<string>('');
  const [denialReason, setDenialReason] = useState<string>('');
  const [requiredPermissions, setRequiredPermissions] = useState<string[]>([]);

  useEffect(() => {
    // Get details from URL params if available
    const action = searchParams.get('action') || 'access this page';
    const role = searchParams.get('required_role') || '';
    const reason = searchParams.get('reason') || '';
    const permissions = searchParams.get('required_permissions')?.split(',') || [];
    
    setAttemptedAction(action);
    setRequiredRole(role);
    setDenialReason(reason);
    setRequiredPermissions(permissions);
  }, [searchParams]);

  const handleLogout = () => {
    logout();
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrator',
      'branch_manager': 'Branch Manager',
      'accountant': 'Accountant',
      'rider': 'Rider',
      'customer': 'Customer'
    };
    return roleMap[role] || role;
  };

  const getRecommendedActions = () => {
    if (!isAuthenticated) {
      return [
        {
          label: 'Sign In',
          action: () => router.push('/login'),
          icon: FiUser,
          primary: true,
          description: 'Sign in with an account that has the required permissions'
        }
      ];
    }

    const actions = [
      {
        label: 'Go to Dashboard',
        action: () => router.push('/dashboard'),
        icon: FiHome,
        primary: true,
        description: 'Return to your main dashboard'
      },
      {
        label: 'Go Back',
        action: () => router.back(),
        icon: FiArrowLeft,
        primary: false,
        description: 'Return to the previous page'
      }
    ];

    // If user doesn't have the required role, suggest logout
    if (requiredRole && user?.role !== requiredRole) {
      actions.push({
        label: 'Switch Account',
        action: handleLogout,
        icon: FiLogOut,
        primary: false,
        description: 'Sign out and sign in with a different account'
      });
    }

    return actions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Main Error Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-8 py-6">
            <div className="flex items-center justify-center">
              <div className="bg-white/20 rounded-full p-4">
                <FiShield className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Permission Denied
            </h1>
            
            <div className="space-y-4 mb-8">
              <p className="text-lg text-gray-600">
                You don&apos;t have the required permissions to {attemptedAction}.
              </p>
              
              {isAuthenticated && user && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <FiUser className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-600">Signed in as:</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                </div>
              )}

              {requiredRole && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <FiLock className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium text-orange-800">Required Role:</span>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    {getRoleDisplayName(requiredRole)}
                  </span>
                </div>
              )}

              {requiredPermissions.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <FiLock className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-800">Required Permissions:</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {requiredPermissions.map((permission, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                      >
                        {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {denialReason && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <FiShield className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-red-800">Reason:</span>
                  </div>
                  <p className="text-sm text-red-700 capitalize">
                    {denialReason.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
            </div>

            {/* Error Code */}
            <div className="text-6xl font-bold text-red-500 mb-4 opacity-20">
              403
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            What would you like to do?
          </h2>
          
          <div className="grid gap-4">
            {getRecommendedActions().map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className={`
                    w-full flex items-center space-x-4 p-4 rounded-xl border transition-all duration-200
                    ${action.primary 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-lg hover:shadow-xl' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${action.primary ? 'text-white' : 'text-gray-500'}`} />
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${action.primary ? 'text-white' : 'text-gray-900'}`}>
                      {action.label}
                    </div>
                    <div className={`text-sm ${action.primary ? 'text-indigo-100' : 'text-gray-500'}`}>
                      {action.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Need Help?
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            If you believe you should have access to this resource, please contact your administrator.
          </p>
          <div className="text-xs text-blue-600">
            Error Code: 403 - Forbidden Access
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
