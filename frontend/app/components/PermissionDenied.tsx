"use client";

import { useAuth } from "../contexts/AuthContext";
import { getDefaultRedirectPath } from "../config/permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FiShield, FiArrowLeft, FiHome } from "react-icons/fi";

export default function PermissionDenied() {
  const { user } = useAuth();
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    if (user?.role) {
      const defaultPath = getDefaultRedirectPath(user.role);
      router.push(defaultPath);
    } else {
      router.push('/login');
    }
  };

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleGoHome();
    }, 5000);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <FiShield className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Access Denied
          </h1>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            You don&apos;t have permission to access this page.
          </p>
          
          {user?.role && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Your role: <span className="font-medium capitalize">{user.role.replace('_', ' ')}</span>
            </p>
          )}

          {/* Auto redirect notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              You will be redirected to your home page in 5 seconds...
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGoBack}
              className="flex items-center justify-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <FiHome className="w-4 h-4" />
              Go to Home
            </button>
          </div>

          {/* Contact support */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Need access to this page? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
