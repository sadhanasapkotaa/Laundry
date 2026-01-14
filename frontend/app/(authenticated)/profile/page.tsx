"use client";
import React, { useState, useEffect } from "react";

import { useAuth } from "../../contexts/AuthContext";
import { useUpdateProfile, useChangePassword } from "../../queries/authQueries";
import { useTranslation } from "react-i18next";
import "../../types/i18n";

import { FaEye, FaEyeSlash, FaCamera, FaUser, FaEnvelope, FaPhone, FaLock, FaPen } from 'react-icons/fa';

export default function StaffProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { mutate: updateProfile, isPending: isUpdating, error: updateError } = useUpdateProfile();
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Password visibility states
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

  // Password change hooks - MUST be declared before early returns
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Sync form state when user data changes
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-24 w-24 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        </div>
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
    if (passwordError) setPasswordError(null);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwords.new !== passwords.confirm) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwords.new.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    changePassword({
      old_password: passwords.current,
      new_password: passwords.new,
      confirm_password: passwords.confirm
    }, {
      onSuccess: (data) => {
        setPasswordSuccess(data.message || "Password changed successfully");
        setPasswords({ current: "", new: "", confirm: "" });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(null);
        }, 2000);
      },
      onError: (error) => {
        setPasswordError(error.message || error.error || "Failed to change password");
      }
    });
  };

  // Helper to get initials
  const getInitials = () => {
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  // Helper to get role display name
  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: 'Administrator',
      branch_manager: 'Branch Manager',
      accountant: 'Accountant',
      rider: 'Delivery Rider',
      customer: 'Customer'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fadeIn">
      {/* Header Section with Avatar */}
      <div className="flex flex-col items-center mb-12">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-4">
            {getInitials()}
          </div>
          <div className="absolute bottom-4 right-0 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md text-gray-500 hover:text-blue-600 cursor-pointer transition-colors opacity-0 group-hover:opacity-100">
            <FaCamera size={14} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {user.first_name} {user.last_name}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{getRoleDisplayName(user.role)}</p>
      </div>

      {updateError && (
        <div className="mb-8 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-center max-w-lg mx-auto">
          {updateError.message || updateError.error || t('profile.updateFailed') || 'Failed to update profile'}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">

        {/* Left Column: Personal Information */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FaUser className="text-blue-500" size={18} />
              Personal Information
            </h2>
            {!editMode && (
              <button
                onClick={handleEdit}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
              >
                <FaPen size={12} /> Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">First Name</label>
                {editMode ? (
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 px-3 py-2 outline-none transition-colors rounded-t-lg"
                    placeholder="First Name"
                    required
                  />
                ) : (
                  <div className="text-lg text-gray-900 dark:text-gray-100 px-3 py-2 bg-transparent border-b border-transparent">
                    {user.first_name}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">Last Name</label>
                {editMode ? (
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 px-3 py-2 outline-none transition-colors rounded-t-lg"
                    placeholder="Last Name"
                    required
                  />
                ) : (
                  <div className="text-lg text-gray-900 dark:text-gray-100 px-3 py-2 bg-transparent border-b border-transparent">
                    {user.last_name}
                  </div>
                )}
              </div>
            </div>

            {/* Username/Email Field - Read Only */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 flex items-center gap-2">
                <FaEnvelope size={10} /> Email / Username
              </label>
              <div className="text-lg text-gray-900 dark:text-gray-100 px-3 py-2 bg-transparent opacity-75">
                {user.email}
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 flex items-center gap-2">
                <FaPhone size={10} /> Phone Number
              </label>
              {editMode ? (
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 px-3 py-2 outline-none transition-colors rounded-t-lg"
                  placeholder="Phone Number"
                />
              ) : (
                <div className="text-lg text-gray-900 dark:text-gray-100 px-3 py-2 bg-transparent border-b border-transparent">
                  {user.phone || <span className="text-gray-400 italic">No phone number added</span>}
                </div>
              )}
            </div>

            {editMode && (
              <div className="flex gap-3 pt-4 animate-fadeIn">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="px-6 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-medium border border-gray-200 dark:border-gray-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </section>

        {/* Right Column: Security */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FaLock className="text-purple-500" size={16} />
              Security
            </h2>
          </div>

          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Password</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Keep your account secure</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors shadow-sm"
              >
                Change Password
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Account Status</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-gray-600 dark:text-gray-300">Active</span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Role</h3>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  {getRoleDisplayName(user.role)}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}></div>

          <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordError && (
                  <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm text-center">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 bg-green-50 text-green-600 border border-green-100 rounded-lg text-sm text-center">
                    {passwordSuccess}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="current"
                      value={passwords.current}
                      onChange={handlePasswordChange}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-4 py-3 outline-none transition-all"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="new"
                      value={passwords.new}
                      onChange={handlePasswordChange}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-4 py-3 outline-none transition-all"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm"
                      value={passwords.confirm}
                      onChange={handlePasswordChange}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-4 py-3 outline-none transition-all"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex justify-center items-center"
                  >
                    {isChangingPassword ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition-all"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}