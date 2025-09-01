"use client";

import "../../../../types/i18n";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaBuilding, FaMoneyBillWave, FaCalendar, FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { branchManagerAPI, BranchManagerFormData } from "../../../services/branchManagerService";
import { branchAPI, Branch } from "../../../services/branchService";

interface FormErrors {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  branch?: string;
  salary?: string;
  hired_date?: string;
  id_type?: string;
  citizenship_number?: string;
}

export default function AddBranchManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState<BranchManagerFormData>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    branch: 0,
    salary: 0,
    hired_date: "",
    leaving_date: "",
    id_type: "citizenship",
    citizenship_number: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const fetchedBranches = await branchAPI.list({ status: 'active' });
      setBranches(fetchedBranches);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      alert(`Error fetching branches: ${error.message}`);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
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
    if (!formData.branch) {
      newErrors.branch = "Branch selection is required";
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
    const { name, value } = e.target;
    let convertedValue: any = value;

    // Convert numeric fields
    if (name === 'branch' || name === 'salary') {
      convertedValue = value ? Number(value) : 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: convertedValue
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
      await branchManagerAPI.create(formData);
      alert("Branch manager created successfully!");
      router.push("/branch-manager");
    } catch (error: any) {
      console.error("Error creating branch manager:", error);
      alert(`Failed to create branch manager: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <FaArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold">Add Branch Manager</h1>
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

            <div className="md:col-span-2">
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
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
              <label htmlFor="branch" className="block text-sm font-medium mb-2">
                Assign Branch *
              </label>
              <select
                id="branch"
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.branch ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="0">Select a branch</option>
                {branches.filter(branch => branch.status === 'active').map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} - {branch.address}
                  </option>
                ))}
              </select>
              {errors.branch && (
                <p className="text-red-500 text-sm mt-1">{errors.branch}</p>
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
            Identification Details
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
                Creating...
              </>
            ) : (
              "Create Branch Manager"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
