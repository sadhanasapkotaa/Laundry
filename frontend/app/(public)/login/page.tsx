"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLogin } from '../../queries/authQueries';
import { LoginRequest } from '../../types/auth';

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate: login, isPending, error } = useLogin();
  
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });

  // Get redirect URL from query parameters (if user was redirected from a protected page)
  const redirectTo = searchParams?.get('redirect') || null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting login with data:', formData);
    
    login(formData, {
      onSuccess: (data) => {
        console.log('Login successful:', data);
        console.log('User role from response:', data.role);
        
        // Always redirect to dashboard after successful login
        const redirectPath = '/dashboard';
        console.log('Redirecting to dashboard:', redirectPath);
        
        // Use replace instead of push to prevent going back to login page
        router.replace(redirectPath);
      },
      onError: (error) => {
        console.error('Login failed:', error);
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error.message || error.error || 'Login failed. Please try again.'}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a
                href="/forgot-password"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </a>
            </div>
            <div className="text-sm">
              <a
                href="/signup"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Don't have an account? Sign up
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;