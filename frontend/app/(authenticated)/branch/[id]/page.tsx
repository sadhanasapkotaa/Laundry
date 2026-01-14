"use client";

import "../../../types/auth";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FaArrowLeft,
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaEdit,
  FaTrash,
  FaUsers,
  FaChartLine,
  FaCalendar,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { branchAPI, Branch } from "../../../services/branchService";

interface User {
  role: 'admin' | 'branch_manager' | 'customer' | 'rider' | 'accountant';
}

const BranchDetail = () => {
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;

  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [user] = useState<User>({ role: 'admin' });

  // Real Data State
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [chartRange, setChartRange] = useState('6m');

  useEffect(() => {
    fetchBranchData();
  }, [branchId]);

  useEffect(() => {
    if (branchId) {
      fetchCharts();
    }
  }, [branchId, chartRange]);

  const fetchBranchData = async () => {
    try {
      setLoading(true);
      const fetchedBranch = await branchAPI.detail(branchId);
      setBranch(fetchedBranch);
    } catch (error: unknown) {
      console.error('Error fetching branch:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error fetching branch: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCharts = async () => {
    try {
      const [perfData, expData] = await Promise.all([
        branchAPI.getBranchPerformance(branchId, chartRange),
        branchAPI.getExpenseBreakdown(branchId, '1m') // Keep breakdown to 1m default or separate control
      ]);
      setPerformanceData(perfData);
      setExpenseBreakdown(expData);
    } catch (error) {
      console.error("Error fetching charts:", error);
    }
  };

  const handleEdit = () => {
    router.push(`/branch/${branchId}/edit`);
  };

  const handleDelete = async () => {
    if (user.role !== 'admin') {
      alert('Only admins can delete branches');
      return;
    }

    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await branchAPI.delete(branchId);
        alert('Branch deleted successfully');
        router.push('/branch');
      } catch (error: unknown) {
        console.error('Error deleting branch:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Error deleting branch: ${errorMessage}`);
      }
    }
  };

  const handleBack = () => {
    router.push('/branch');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Branch Not Found</h1>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Branches
        </button>
      </div>
    );
  }

  const netProfit = branch.monthly_revenue - branch.monthly_expenses;
  const profitMargin = ((netProfit / branch.monthly_revenue) * 100).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft /> Back to Branches
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaBuilding className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{branch.name}</h1>
              <p className="text-gray-600">Branch ID: {branch.branch_id}</p>
              <span
                className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${branch.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
                  }`}
              >
                {branch.status}
              </span>
            </div>
          </div>

          {user.role === 'admin' && (
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FaEdit /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <FaTrash /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 border rounded-lg shadow-sm bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Monthly Revenue</p>
              <p className="text-2xl font-bold text-blue-900">₨ {branch.monthly_revenue.toLocaleString()}</p>
            </div>
            <FaChartLine className="text-blue-500 text-2xl" />
          </div>
        </div>

        <div className="p-6 border rounded-lg shadow-sm bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-900">₨ {branch.monthly_expenses.toLocaleString()}</p>
            </div>
            <FaChartLine className="text-red-500 text-2xl" />
          </div>
        </div>

        <div className="p-6 border rounded-lg shadow-sm bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Net Profit</p>
              <p className="text-2xl font-bold text-green-900">₨ {netProfit.toLocaleString()}</p>
              <p className="text-sm text-green-600">{profitMargin}% margin</p>
            </div>
            <FaChartLine className="text-green-500 text-2xl" />
          </div>
        </div>

        <div className="p-6 border rounded-lg shadow-sm bg-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Total Orders</p>
              <p className="text-2xl font-bold text-purple-900">{branch.total_orders}</p>
            </div>
            <FaUsers className="text-purple-500 text-2xl" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Branch Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Branch Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FaMapMarkerAlt className="text-gray-400" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-gray-600">{branch.address}, {branch.city}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaPhone className="text-gray-400" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-gray-600">{branch.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaEnvelope className="text-gray-400" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-gray-600">{branch.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaUsers className="text-gray-400" />
                <div>
                  <p className="font-medium">Manager</p>
                  <p className="text-gray-600">{branch.branch_manager}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaCalendar className="text-gray-400" />
                <div>
                  <p className="font-medium">Opening Date</p>
                  <p className="text-gray-600">{new Date(branch.opening_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaUsers className="text-gray-400" />
                <div>
                  <p className="font-medium">Staff Count</p>
                  <p className="text-gray-600">{branch.staff_count} employees</p>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Expense Breakdown</h2>
            {expenseBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₨ ${Number(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">No expenses recorded</div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue vs Expenses */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Revenue vs Expenses (Last 6 Months)</h2>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₨ ${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                  <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
            )}
          </div>

          {/* Orders Trend */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Orders Trend</h2>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">No order data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDetail;
