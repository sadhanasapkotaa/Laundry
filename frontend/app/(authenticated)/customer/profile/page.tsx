"use client";
import React, { useState, useEffect } from "react";

import { useAuth } from "../../../contexts/AuthContext";
import { useUpdateProfile } from "../../../queries/authQueries";
import { useTranslation } from "react-i18next";
import "../../../types/i18n";

import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Added import

export default function CustomerProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { mutate: updateProfile, isPending: isUpdating, error: updateError } = useUpdateProfile();
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Added visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  // Sync form state when user data changes (e.g., after profile update)
  useEffect(() => {
    if (user && !editMode) {
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user, editMode]);


  if (!user) {
    return (
      <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-8 mt-8 text-center text-gray-500">
        {t('customer.profile.loading')}
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || "",
    });
  };
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(form, {
      onSuccess: () => {
        setEditMode(false);
      },
      onError: (error) => {
        console.error('Failed to update profile:', error);
      },
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call API to change password
    setShowPasswordModal(false);
    setPasswords({ current: "", new: "", confirm: "" });
  };

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-8 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('customer.profile.title')}</h1>

      {updateError && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          {updateError.message || updateError.error || t('customer.profile.updateFailed')}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSave}>
        <div>
          <span className="block text-gray-500 dark:text-gray-400 text-sm">{t('customer.profile.fullName')}</span>
          {editMode ? (
            <div className="flex gap-2">
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="border rounded px-2 py-1 w-1/2"
                placeholder={t('customer.profile.firstName')}
                required
              />
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="border rounded px-2 py-1 w-1/2"
                placeholder={t('customer.profile.lastName')}
                required
              />
            </div>
          ) : (
            <span className="block text-lg font-medium text-gray-900 dark:text-gray-100">
              {user.first_name} {user.last_name}
            </span>
          )}
        </div>
        <div>
          <span className="block text-gray-500 dark:text-gray-400 text-sm">{t('customer.profile.email')}</span>
          {editMode ? (
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
              placeholder={t('customer.profile.email')}
              required
            />
          ) : (
            <span className="block text-lg font-medium text-gray-900 dark:text-gray-100">
              {user.email}
            </span>
          )}
        </div>
        <div>
          <span className="block text-gray-500 dark:text-gray-400 text-sm">{t('customer.profile.phone')}</span>
          {editMode ? (
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
              placeholder={t('customer.profile.phoneNumber')}
              required
            />
          ) : (
            <span className="block text-lg font-medium text-gray-900 dark:text-gray-100">
              {user.phone || "-"}
            </span>
          )}
        </div>
        <div className="flex gap-2 mt-6">
          {editMode ? (
            <>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg"
              >
                {isUpdating ? t('customer.profile.saving') : t('customer.profile.save')}
              </button>
              <button
                type="button"
                disabled={isUpdating}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-800 rounded-lg"
                onClick={handleCancel}
              >
                {t('customer.profile.cancel')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                onClick={handleEdit}
              >
                {t('customer.profile.editProfile')}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
                onClick={() => setShowPasswordModal(true)}
              >
                {t('customer.profile.changePassword')}
              </button>
            </>
          )}
        </div>
      </form>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-gray-200 dark:border-gray-700 animate-fadeIn">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors duration-200"
              onClick={() => setShowPasswordModal(false)}
              aria-label="Close"
            >
              <span aria-hidden="true">×</span>
            </button>
            <div className="flex flex-col items-center mb-4">
              <span className="inline-block bg-blue-100 text-blue-600 rounded-full p-3 mb-2 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75A4.5 4.5 0 008 6.75v3.75m8.25 0a2.25 2.25 0 012.25 2.25v4.5A2.25 2.25 0 0116.25 21H7.75A2.25 2.25 0 015.5 17.25v-4.5a2.25 2.25 0 012.25-2.25m8.25 0H7.75" />
                </svg>
              </span>
              <h2 className="text-2xl font-extrabold mb-1 text-gray-900 dark:text-gray-100">{t('customer.profile.passwordModal.title')}</h2>
              <p className="text-gray-500 dark:text-gray-300 text-sm">{t('customer.profile.passwordModal.subtitle')}</p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              import {FaEye, FaEyeSlash} from 'react-icons/fa';

              // ... (in component body)
              const [showCurrentPassword, setShowCurrentPassword] = useState(false);
              const [showNewPassword, setShowNewPassword] = useState(false);
              const [showConfirmPassword, setShowConfirmPassword] = useState(false);

              // ... (inside form render)
              <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm mb-1 font-semibold">{t('customer.profile.passwordModal.currentPassword')}</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="current"
                    value={passwords.current}
                    onChange={handlePasswordChange}
                    className="border border-gray-300 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 rounded-lg px-3 py-2 w-full outline-none transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm mb-1 font-semibold">{t('customer.profile.passwordModal.newPassword')}</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="new"
                    value={passwords.new}
                    onChange={handlePasswordChange}
                    className="border border-gray-300 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 rounded-lg px-3 py-2 w-full outline-none transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm mb-1 font-semibold">{t('customer.profile.passwordModal.confirmPassword')}</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm"
                    value={passwords.confirm}
                    onChange={handlePasswordChange}
                    className="border border-gray-300 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 rounded-lg px-3 py-2 w-full outline-none transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-4 justify-center">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition-colors duration-200"
                >
                  {t('customer.profile.passwordModal.changeButton')}
                </button>
                <button
                  type="button"
                  className="px-5 py-2 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-lg shadow transition-colors duration-200"
                  onClick={() => setShowPasswordModal(false)}
                >
                  {t('customer.profile.passwordModal.cancelButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

