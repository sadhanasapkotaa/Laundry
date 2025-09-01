"use client";

import "../../../../../../types/i18n";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaUser, FaBuilding, FaMoneyBillWave, FaCalendar, FaArrowLeft } from "react-icons/fa";

interface Branch {
  id: string;
  name: string;
  address: string;
  status: string;
}

interface BranchManager {
  id: string;
  manager_id: string;
  user_email: string;
  user_name: string;
  first_name: string;
  last_name: string;
  phone?: string;
  branch_id: string;
  branch_name: string;
  salary: number;
  hired_date: string;
  leaving_date?: string;
  id_type: string;
  citizenship_number: string;
  is_active: boolean;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  branch_id: string;
  salary: string;
  hired_date: string;
  leaving_date: string;
  id_type: string;
  citizenship_number: string;
  is_active: boolean;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  branch_id?: string;
  salary?: string;
  hired_date?: string;
  id_type?: string;
  citizenship_number?: string;
}

export default function EditBranchManager() {
  const router = useRouter();
  const params = useParams();
  const managerId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    branch_id: "",
    salary: "",
    hired_date: "",
    leaving_date: "",
    id_type: "citizenship",
    citizenship_number: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Mock branches data
  const mockBranches: Branch[] = [
    { id: "1", name: "Main Branch", address: "Kathmandu, Nepal", status: "active" },
    { id: "2", name: "Downtown Branch", address: "Pokhara, Nepal", status: "active" },
    { id: "3", name: "Pokhara Branch", address: "Pokhara, Nepal", status: "active" },
  ];

  // Mock manager data
  const mockManager: BranchManager = {
    id: "1",
    manager_id: "MGR-001",
    user_email: "john.manager@laundrypro.com",
    user_name: "John Manager",
    first_name: "John",
    last_name: "Manager",
    phone: "+977-9841234567",
    branch_id: "1",
    branch_name: "Main Branch",
    salary: 75000,
    hired_date: "2023-01-15",
    leaving_date: "",
    id_type: "citizenship",
    citizenship_number: "123456789",
    is_active: true,
  };

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setBranches(mockBranches);
      
      // Pre-populate form with existing manager data
      setFormData({
        first_name: mockManager.first_name,
        last_name: mockManager.last_name,
        email: mockManager.user_email,
        phone: mockManager.phone || "",
        branch_id: mockManager.branch_id,
        salary: mockManager.salary.toString(),
        hired_date: mockManager.hired_date,
        leaving_date: mockManager.leaving_date || "",
        id_type: mockManager.id_type,
        citizenship_number: mockManager.citizenship_number,
        is_active: mockManager.is_active,
      });
      
      setDataLoading(false);
    }, 1000);
  }, [managerId]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    // Branch validation
    if (!formData.branch_id) {
      newErrors.branch_id = "Branch selection is required";
    }

    // Salary validation
    if (!formData.salary) {
      newErrors.salary = "Salary is required";
    } else if (isNaN(Number(formData.salary)) || Number(formData.salary) <= 0) {
      newErrors.salary = "Salary must be a positive number";
    }

    // Hired date validation
    if (!formData.hired_date) {
      newErrors.hired_date = "Hired date is required";
    }

    // ID type and citizenship number validation
    if (!formData.id_type) {
      newErrors.id_type = "ID type is required";
    }

    if (!formData.citizenship_number.trim()) {
      newErrors.citizenship_number = "ID number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log("Updating branch manager:", formData);
      alert("Branch manager updated successfully!");
      router.push(`/branch-manager/${managerId}`);
    } catch (error) {
      console.error("Error updating branch manager:", error);
      alert("Failed to update branch manager. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <FaArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold">Edit Branch Manager</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaUser className="text-blue-600" />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium mb-2">
                First Name *
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.first_name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter first name"
              />
              {errors.first_name && (
                <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium mb-2">
                Last Name *
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.last_name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter last name"
              />
              {errors.last_name && (
                <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaBuilding className="text-green-600" />
            Branch & Employment Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="branch_id" className="block text-sm font-medium mb-2">
                Assign Branch *
              </label>
              <select
                id="branch_id"
                name="branch_id"
                value={formData.branch_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.branch_id ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a branch</option>
                {branches.filter(branch => branch.status === 'active').map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} - {branch.address}
                  </option>
                ))}
              </select>
              {errors.branch_id && (
                <p className="text-red-500 text-sm mt-1">{errors.branch_id}</p>
              )}
            </div>

            <div>
              <label htmlFor="salary" className="block text-sm font-medium mb-2">
                Monthly Salary (₨) *
              </label>
              <input
                type="number"
                id="salary"
                name="salary"
                value={formData.salary}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.salary ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter monthly salary"
                min="0"
                step="1000"
              />
              {errors.salary && (
                <p className="text-red-500 text-sm mt-1">{errors.salary}</p>
              )}
            </div>

            <div>
              <label htmlFor="hired_date" className="block text-sm font-medium mb-2">
                Hired Date *
              </label>
              <input
                type="date"
                id="hired_date"
                name="hired_date"
                value={formData.hired_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.hired_date ? "border-red-500" : "border-gray-300"
                }`}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.hired_date && (
                <p className="text-red-500 text-sm mt-1">{errors.hired_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="leaving_date" className="block text-sm font-medium mb-2">
                Contract End Date (Optional)
              </label>
              <input
                type="date"
                id="leaving_date"
                name="leaving_date"
                value={formData.leaving_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={formData.hired_date || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaCalendar className="text-purple-600" />
            Identification & Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="id_type" className="block text-sm font-medium mb-2">
                ID Type *
              </label>
              <select
                id="id_type"
                name="id_type"
                value={formData.id_type}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.id_type ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="citizenship">Citizenship Certificate</option>
                <option value="national_id">National ID Card</option>
                <option value="drivers_licence">Driver's License</option>
                <option value="passport">Passport</option>
              </select>
              {errors.id_type && (
                <p className="text-red-500 text-sm mt-1">{errors.id_type}</p>
              )}
            </div>

            <div>
              <label htmlFor="citizenship_number" className="block text-sm font-medium mb-2">
                ID Number *
              </label>
              <input
                type="text"
                id="citizenship_number"
                name="citizenship_number"
                value={formData.citizenship_number}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.citizenship_number ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter ID number"
              />
              {errors.citizenship_number && (
                <p className="text-red-500 text-sm mt-1">{errors.citizenship_number}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active Manager (uncheck to deactivate this manager)
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              "Update Branch Manager"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
