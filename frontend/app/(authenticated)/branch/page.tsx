"use client";

import "../../types/i18n";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import {
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaFilter,
  FaEye,
  FaChartLine,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { branchAPI, Branch } from "../../services/branchService";
import { useAuth } from "../../contexts/AuthContext";



export default function BranchManagement() {
  const { t } = useTranslation();
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);

  // Performance Chart State
  const [performanceData, setPerformanceData] = useState<Array<{ branch: string; orders: number; income: number }>>([]);
  const [chartRange, setChartRange] = useState('7d');
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Starting to fetch branches...');

      const branchesArray = await branchAPI.list();
      console.log('Fetched branches array:', branchesArray);
      console.log('Number of branches:', branchesArray.length);

      setBranches(branchesArray);
      setFilteredBranches(branchesArray);
    } catch (error: unknown) {
      console.error('Error fetching branches:', error);

      // Set empty array to prevent map errors
      setBranches([]);
      setFilteredBranches([]);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Error fetching branches: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoadingChart(true);
      const data = await branchAPI.getOverallPerformance(chartRange);
      setPerformanceData(data);
    } catch (error) {
      console.error("Error fetching performance data:", error);
      // Don't block the whole page if just charts fail, but log it possibly to a toast or just console
    } finally {
      setLoadingChart(false);
    }
  }, [chartRange]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Fetch performance data when range changes
  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  useEffect(() => {
    // Ensure branches is an array before filtering
    if (!Array.isArray(branches)) {
      console.warn('Branches is not an array:', branches);
      setFilteredBranches([]);
      return;
    }

    let filtered = [...branches];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (branch) =>
          branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.branch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.branch_manager.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((branch) => branch.status === statusFilter);
    }

    // Apply city filter
    if (cityFilter !== "all") {
      filtered = filtered.filter((branch) => branch.city === cityFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number = a[sortBy as keyof Branch] as string | number;
      let bValue: string | number = b[sortBy as keyof Branch] as string | number;

      // Handle special sorting cases
      if (sortBy === "monthly_revenue" || sortBy === "monthly_expenses") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortBy === "net_profit") {
        aValue = a.monthly_revenue - a.monthly_expenses;
        bValue = b.monthly_revenue - b.monthly_expenses;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBranches(filtered);
  }, [branches, searchTerm, statusFilter, cityFilter, sortBy, sortOrder]);

  const handleDeleteBranch = async (branchId: number) => {
    if (user?.role !== 'admin') {
      alert('Only admins can delete branches');
      return;
    }

    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await branchAPI.delete(branchId);
        setBranches(branches.filter(branch => branch.id !== branchId));
        alert('Branch deleted successfully');
      } catch (error: unknown) {
        console.error('Error deleting branch:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Error deleting branch: ${errorMessage}`);
      }
    }
  };

  const uniqueCities = [...new Set(branches.map(branch => branch.city))];

  const totalRevenue = filteredBranches.reduce((sum, b) => sum + b.monthly_revenue, 0);
  const totalExpenses = filteredBranches.reduce((sum, b) => sum + b.monthly_expenses, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("branches.title")}</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchBranches}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            🔄 Refresh
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => router.push("/branch/add")}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <FaPlus /> {t("branches.addBranch")}
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            <FaFilter /> Filters
          </button>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="monthly_revenue-desc">Highest Revenue</option>
            <option value="monthly_revenue-asc">Lowest Revenue</option>
            <option value="monthly_expenses-desc">Highest Expenses</option>
            <option value="monthly_expenses-asc">Lowest Expenses</option>
            <option value="net_profit-desc">Highest Profit</option>
            <option value="net_profit-asc">Lowest Profit</option>
            <option value="total_orders-desc">Most Orders</option>
            <option value="opening_date-desc">Newest</option>
            <option value="opening_date-asc">Oldest</option>
          </select>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCityFilter("all");
                  setSortBy("name");
                  setSortOrder("asc");
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Performance Analytics</h2>
          <select
            value={chartRange}
            onChange={(e) => setChartRange(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="1m">This Month</option>
            <option value="1y">This Year</option>
          </select>
        </div>

        {loadingChart ? (
          <div className="h-72 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : performanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  if (chartRange === '1y') return new Date(value).toLocaleDateString(undefined, { month: 'short' });
                  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                }}
              />
              <YAxis />
              <Tooltip
                formatter={(value) => `₨ ${Number(value).toLocaleString()}`}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-72 flex flex-col items-center justify-center text-gray-400">
            <FaChartLine className="h-12 w-12 mb-2 opacity-20" />
            <p>No performance data available for this period</p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-4 border rounded-lg shadow-sm bg-blue-50">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-blue-700">Total Branches</p>
            <FaBuilding className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-blue-900">{filteredBranches.length}</p>
        </div>
        <div className="p-4 border rounded-lg shadow-sm bg-green-50">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-green-700">Monthly Revenue</p>
            <FaChartLine className="text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-green-900">₨ {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="p-4 border rounded-lg shadow-sm bg-orange-50">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-orange-700">Monthly Expenses</p>
            <FaChartLine className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-orange-900">₨ {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="p-4 border rounded-lg shadow-sm bg-purple-50">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-purple-700">Net Profit</p>
            <FaChartLine className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-900">₨ {(totalRevenue - totalExpenses).toLocaleString()}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 border rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Branch Performance Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filteredBranches}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `₨ ${Number(value).toLocaleString()}`} />
            <Legend />
            <Bar dataKey="monthly_revenue" fill="#3B82F6" name="Revenue" />
            <Bar dataKey="monthly_expenses" fill="#EF4444" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Branch List */}
      <div className="p-4 border rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">
          All Branches ({filteredBranches.length})
        </h2>
        <div className="space-y-4">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="border rounded-lg p-4 flex items-start justify-between hover:bg-gray-50"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg">{branch.name}</h3>
                  <span className="text-sm text-gray-500">({branch.branch_id})</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${branch.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                      }`}
                  >
                    {branch.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <FaMapMarkerAlt /> {branch.address}, {branch.city}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <FaPhone /> {branch.phone}
                </p>
                {branch.email && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <FaEnvelope /> {branch.email}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  Manager: {branch.branch_manager}
                </p>
              </div>

              <div className="text-right space-y-1 ml-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-green-600">₨ {branch.monthly_revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                  <div>
                    <p className="font-semibold text-red-600">₨ {branch.monthly_expenses.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Expenses</p>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-600">{branch.total_orders}</p>
                    <p className="text-xs text-gray-500">Orders</p>
                  </div>
                  <div>
                    <p className="font-semibold text-purple-600">{branch.staff_count}</p>
                    <p className="text-xs text-gray-500">Staff</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => router.push(`/branch/${branch.id}`)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                  {user?.role === 'admin' && (
                    <>
                      <button
                        onClick={() => router.push(`/branch/${branch.id}/edit`)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded"
                        title="Edit Branch"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteBranch(branch.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                        title="Delete Branch"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredBranches.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FaBuilding className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg">No branches found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
