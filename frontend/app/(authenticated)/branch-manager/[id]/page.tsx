"use client";

import "../../../types/i18n";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  FaArrowLeft, 
  FaUser, 
  FaBuilding, 
  FaMoneyBillWave, 
  FaCalendar, 
  FaEdit, 
  FaTrash, 
  FaEnvelope, 
  FaPhone,
  FaIdCard,
  FaCheckCircle,
  FaTimesCircle,
  FaChartLine,
  FaClipboardList
} from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface BranchManager {
  id: string;
  manager_id: string;
  user_email: string;
  user_name: string;
  branch_id: string;
  branch_name: string;
  salary: number;
  hired_date: string;
  leaving_date?: string;
  id_type: string;
  citizenship_number: string;
  is_active: boolean;
  created: string;
  phone?: string;
}

interface User {
  role: 'admin' | 'branch_manager' | 'customer' | 'rider' | 'accountant';
}

interface PerformanceData {
  month: string;
  orders: number;
  revenue: number;
  customer_satisfaction: number;
}

export default function BranchManagerDetail() {
  const router = useRouter();
  const params = useParams();
  const managerId = params.id as string;
  
  const [manager, setManager] = useState<BranchManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  // Mock user data
  const [user] = useState<User>({ role: 'admin' });

  // Mock manager data
  const mockManager: BranchManager = {
    id: "1",
    manager_id: "MGR-001",
    user_email: "john.manager@laundrypro.com",
    user_name: "John Manager",
    branch_id: "1",
    branch_name: "Main Branch",
    salary: 75000,
    hired_date: "2023-01-15",
    id_type: "citizenship",
    citizenship_number: "123456789",
    is_active: true,
    created: "2023-01-15",
    phone: "+977-9841234567",
  };

  // Mock performance data
  const mockPerformanceData: PerformanceData[] = [
    { month: "Jan", orders: 245, revenue: 185000, customer_satisfaction: 4.5 },
    { month: "Feb", orders: 268, revenue: 201000, customer_satisfaction: 4.3 },
    { month: "Mar", orders: 290, revenue: 218000, customer_satisfaction: 4.6 },
    { month: "Apr", orders: 312, revenue: 234000, customer_satisfaction: 4.4 },
    { month: "May", orders: 298, revenue: 223000, customer_satisfaction: 4.7 },
    { month: "Jun", orders: 325, revenue: 243000, customer_satisfaction: 4.5 },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setManager(mockManager);
      setPerformanceData(mockPerformanceData);
      setLoading(false);
    }, 1000);
  }, [managerId]);

  const handleDeleteManager = async () => {
    if (user.role !== 'admin') {
      alert('Only admins can delete branch managers');
      return;
    }

    if (window.confirm('Are you sure you want to delete this branch manager?')) {
      alert('Branch manager deleted successfully');
      router.push('/branch-manager');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₨ ${amount.toLocaleString()}`;
  };

  const calculateTenure = (hiredDate: string, leavingDate?: string) => {
    const start = new Date(hiredDate);
    const end = leavingDate ? new Date(leavingDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
    }
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!manager) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Branch Manager Not Found</h2>
        <p className="text-gray-600 mt-2">The requested branch manager could not be found.</p>
        <button
          onClick={() => router.push('/branch-manager')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Branch Managers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FaArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{manager.user_name}</h1>
            <p className="text-gray-600">Manager ID: {manager.manager_id}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              manager.is_active
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {manager.is_active ? "Active" : "Inactive"}
          </span>
        </div>
        
        {user.role === 'admin' && (
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/branch-manager/${managerId}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <FaEdit /> Edit
            </button>
            <button
              onClick={handleDeleteManager}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <FaTrash /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Basic Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Salary</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(manager.salary)}</p>
            </div>
            <FaMoneyBillWave className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tenure</p>
              <p className="text-2xl font-bold text-blue-600">{calculateTenure(manager.hired_date, manager.leaving_date)}</p>
            </div>
            <FaCalendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Branch</p>
              <p className="text-xl font-bold text-purple-600">{manager.branch_name}</p>
            </div>
            <FaBuilding className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-xl font-bold text-gray-800">
                {manager.is_active ? "Active" : "Inactive"}
              </p>
            </div>
            {manager.is_active ? (
              <FaCheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <FaTimesCircle className="h-8 w-8 text-red-500" />
            )}
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaUser className="text-blue-600" />
            Personal Information
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FaEnvelope className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{manager.user_email}</p>
              </div>
            </div>

            {manager.phone && (
              <div className="flex items-center gap-3">
                <FaPhone className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{manager.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <FaIdCard className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">ID Type</p>
                <p className="font-medium">{manager.id_type.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FaIdCard className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">ID Number</p>
                <p className="font-medium">{manager.citizenship_number}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaClipboardList className="text-green-600" />
            Employment Details
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FaCalendar className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Hired Date</p>
                <p className="font-medium">{new Date(manager.hired_date).toLocaleDateString()}</p>
              </div>
            </div>

            {manager.leaving_date && (
              <div className="flex items-center gap-3">
                <FaCalendar className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Contract End Date</p>
                  <p className="font-medium">{new Date(manager.leaving_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <FaBuilding className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Assigned Branch</p>
                <p className="font-medium">{manager.branch_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FaMoneyBillWave className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Monthly Salary</p>
                <p className="font-medium">{formatCurrency(manager.salary)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FaCalendar className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Created On</p>
                <p className="font-medium">{new Date(manager.created).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders and Revenue Chart */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaChartLine className="text-blue-600" />
            Branch Performance - Orders & Revenue
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="orders" orientation="left" />
              <YAxis yAxisId="revenue" orientation="right" />
              <Tooltip formatter={(value, name) => {
                if (name === 'revenue') return [formatCurrency(Number(value)), 'Revenue'];
                return [value, name];
              }} />
              <Legend />
              <Bar yAxisId="orders" dataKey="orders" fill="#3B82F6" name="Orders" />
              <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Satisfaction Chart */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaChartLine className="text-green-600" />
            Customer Satisfaction
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 5]} />
              <Tooltip formatter={(value) => [`${value}/5`, 'Rating']} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="customer_satisfaction" 
                stroke="#F59E0B" 
                strokeWidth={3} 
                name="Customer Rating"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {performanceData.reduce((sum, data) => sum + data.orders, 0)}
            </p>
            <p className="text-sm text-blue-700">Total Orders (6 months)</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(performanceData.reduce((sum, data) => sum + data.revenue, 0))}
            </p>
            <p className="text-sm text-green-700">Total Revenue (6 months)</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {(performanceData.reduce((sum, data) => sum + data.customer_satisfaction, 0) / performanceData.length).toFixed(1)}/5
            </p>
            <p className="text-sm text-yellow-700">Average Customer Rating</p>
          </div>
        </div>
      </div>
    </div>
  );
}
