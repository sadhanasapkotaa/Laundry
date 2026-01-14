"use client";

import "../../../../types/i18n";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FaArrowLeft,
  FaBuilding,
  FaMapMarkerAlt,
  FaUser,
  FaTimes,
  FaSave,
} from "react-icons/fa";
import { branchAPI, BranchFormData } from "../../../../services/branchService";
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const MapAddressSelector = dynamic(
  () => import('../../../../components/MapAddressSelector'),
  { ssr: false }
);

const EditBranch = () => {
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<BranchFormData>>({});

  const [formData, setFormData] = useState<BranchFormData>({
    name: "",
    address: "",
    city: "",
    map_link: "",
    phone: "",
    email: "",
    branch_manager: "",
    status: "active",
    opening_date: "",
  });

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        setLoading(true);
        const branch = await branchAPI.detail(branchId);
        setFormData({
          name: branch.name,
          address: branch.address,
          city: branch.city,
          map_link: branch.map_link,
          phone: branch.phone,
          email: branch.email,
          branch_manager: branch.branch_manager,
          status: branch.status,
          opening_date: branch.opening_date,
        });
      } catch (error: unknown) {
        console.error('Error fetching branch:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Error fetching branch: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    fetchBranch();
  }, [branchId]);



  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof BranchFormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddressSelect = (address: string, mapLink: string) => {
    setFormData((prev) => ({
      ...prev,
      address,
      map_link: mapLink,
    }));

    // Clear address error if it exists
    if (errors.address) {
      setErrors((prev) => ({ ...prev, address: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<BranchFormData> = {};

    if (!formData.name.trim()) newErrors.name = "Branch name is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.branch_manager.trim()) newErrors.branch_manager = "Branch manager is required";
    if (!formData.opening_date) newErrors.opening_date = "Opening date is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    const phoneRegex = /^[\+]?[0-9\-\(\)\s]+$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await branchAPI.update(branchId, formData);
      alert("Branch updated successfully!");
      router.push(`/branch/${branchId}`);
    } catch (error: unknown) {
      console.error("Error updating branch:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error updating branch: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/branch/${branchId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft /> Back
          </button>
        </div>
        <h1 className="text-3xl font-bold">Edit Branch</h1>
        <p className="text-gray-600 mt-2">Update branch information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Branch Information */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaBuilding className="text-blue-600" />
            <h2 className="text-xl font-semibold">Branch Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Branch Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter branch name"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                <FaMapMarkerAlt className="inline mr-2" />
                Address & Location *
              </label>
              <MapAddressSelector
                onAddressSelect={handleAddressSelect}
                initialAddress={formData.address}
                initialMapLink={formData.map_link}
                height="400px"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Enter city"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.city ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+977-1-4567890"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="branch@example.com"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="opening_date" className="block text-sm font-medium text-gray-700 mb-2">
                Opening Date *
              </label>
              <input
                type="date"
                id="opening_date"
                name="opening_date"
                value={formData.opening_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.opening_date ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.opening_date && (
                <p className="text-red-500 text-sm mt-1">{errors.opening_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Manager Information */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaUser className="text-green-600" />
            <h2 className="text-xl font-semibold">Manager Information</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="branch_manager" className="block text-sm font-medium text-gray-700 mb-2">
                Branch Manager Name *
              </label>
              <input
                type="text"
                id="branch_manager"
                name="branch_manager"
                value={formData.branch_manager}
                onChange={handleInputChange}
                placeholder="Enter manager name"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.branch_manager ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.branch_manager && (
                <p className="text-red-500 text-sm mt-1">{errors.branch_manager}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Note: You can assign a specific user as branch manager from the branch managers section.
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            <FaTimes /> Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave /> {isLoading ? 'Updating...' : 'Update Branch'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBranch;
