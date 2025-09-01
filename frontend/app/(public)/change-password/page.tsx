"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChangePassword } from '../../queries/authQueries';
import { ChangePasswordRequest } from '../../types/auth';

const ChangePasswordPage = () => {
  const router = useRouter();
  const { mutate: changePassword, isPending, error, isSuccess } = useChangePassword();
  
  const [formData, setFormData] = useState<ChangePasswordRequest>({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.confirm_password) {
      alert('New passwords do not match');
      return;
    }

    changePassword(formData, {
      onSuccess: (data) => {
        console.log('Password changed successfully:', data);
        alert('Password changed successfully!');
        router.push('/dashboard');
      },
      onError: (error) => {
        console.error('Password change failed:', error);
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Change Password
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="old_password" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                id="old_password"
                name="old_password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Current Password"
                value={formData.old_password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="New Password"
                value={formData.new_password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm New Password"
                value={formData.confirm_password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error.message || error.error || 'Password change failed. Please try again.'}
            </div>
          )}

          {isSuccess && (
            <div className="text-green-600 text-sm text-center">
              Password changed successfully!
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Changing...' : 'Change Password'}
            </button>
          </div>

          <div className="text-center">
            <div className="text-sm">
              <a
                href="/dashboard"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;