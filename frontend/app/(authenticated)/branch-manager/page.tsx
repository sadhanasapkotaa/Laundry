"use client";

import "../../types/i18n";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaPlus,
  FaUser,
  FaBuilding,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaEye,
  FaPhone,
  FaEnvelope,
  FaCalendar,
  FaMoneyBillWave,
} from "react-icons/fa";
import { branchManagerAPI, BranchManager } from "../../services/branchManagerService";

interface User {
  role: 'admin' | 'branch_manager' | 'customer' | 'rider' | 'accountant';
}

export default function BranchManagerManagement() {
  const router = useRouter();
  const [managers, setManagers] = useState<BranchManager[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<BranchManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Mock user data
  const [user] = useState<User>({ role: 'admin' });

  useEffect(() => {
    fetchBranchManagers();
  }, []);

  const fetchBranchManagers = async () => {
    try {
      setLoading(true);
      const fetchedManagers = await branchManagerAPI.list();
      setManagers(fetchedManagers);
      setFilteredManagers(fetchedManagers);
    } catch (error: any) {
      console.error('Error fetching branch managers:', error);
      alert(`Error fetching branch managers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterManagers();
  }, [managers, searchTerm, statusFilter, branchFilter]);

  const filterManagers = () => {
    let filtered = [...managers];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (manager) =>
          manager.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          manager.manager_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          manager.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          manager.branch_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((manager) => manager.is_active === isActive);
    }

    // Apply branch filter
    if (branchFilter !== "all") {
      filtered = filtered.filter((manager) => manager.branch.toString() === branchFilter);
    }

    setFilteredManagers(filtered);
  };

  const handleDeleteManager = async (managerId: number) => {
    if (user.role !== 'admin') {
      alert('Only admins can delete branch managers');
      return;
    }

    if (window.confirm('Are you sure you want to delete this branch manager?')) {
      try {
        await branchManagerAPI.delete(managerId);
        setManagers(managers.filter(manager => manager.id !== managerId));
        alert('Branch manager deleted successfully');
      } catch (error: any) {
        console.error('Error deleting branch manager:', error);
        alert(`Error deleting branch manager: ${error.message}`);
      }
    }
  };

  const uniqueBranches = [...new Set(managers.map(manager => ({ 
    id: manager.branch.toString(), 
    name: manager.branch_name 
  })))];

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
        <h1 className="text-3xl font-bold">Branch Managers</h1>
        {user.role === 'admin' && (
          <button 
            onClick={() => router.push("/branch-manager/add")}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <FaPlus /> Add Branch Manager
          </button>
        )}
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
                placeholder="Search managers..."
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
              <label className="block text-sm font-medium mb-1">Branch</label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Branches</option>
                {uniqueBranches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setBranchFilter("all");
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-4 border rounded-lg shadow-sm bg-blue-50">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-blue-700">Total Managers</p>
            <FaUser className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-blue-900">{filteredManagers.length}</p>
        </div>
        <div className="p-4 border rounded-lg shadow-sm bg-green-50">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-green-700">Active Managers</p>
            <FaUser className="text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-green-900">
            {filteredManagers.filter(m => m.is_active).length}
          </p>
        </div>
        <div className="p-4 border rounded-lg shadow-sm bg-orange-50">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-orange-700">Average Salary</p>
            <FaMoneyBillWave className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-orange-900">
            ₨ {Math.round(filteredManagers.reduce((sum, m) => sum + m.salary, 0) / filteredManagers.length || 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 border rounded-lg shadow-sm bg-purple-50">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-purple-700">Total Salary</p>
            <FaMoneyBillWave className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-900">
            ₨ {filteredManagers.reduce((sum, m) => sum + m.salary, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Manager List */}
      <div className="p-4 border rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">
          All Branch Managers ({filteredManagers.length})
        </h2>
        <div className="space-y-4">
          {filteredManagers.map((manager) => (
            <div
              key={manager.id}
              className="border rounded-lg p-4 flex items-start justify-between hover:bg-gray-50"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <FaUser className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{manager.user_name}</h3>
                    <p className="text-sm text-gray-600">ID: {manager.manager_id}</p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        manager.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {manager.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-12">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <FaEnvelope /> {manager.user_email}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <FaBuilding /> {manager.branch_name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <FaCalendar /> Hired: {new Date(manager.hired_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <FaMoneyBillWave /> Salary: ₨ {manager.salary.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      ID Type: {manager.id_type.replace('_', ' ').toUpperCase()}
                    </p>
                    {manager.leaving_date && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <FaCalendar /> Leaving: {new Date(manager.leaving_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 ml-4">
                <button
                  onClick={() => router.push(`/branch-manager/${manager.id}`)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                  title="View Details"
                >
                  <FaEye />
                </button>
                {user.role === 'admin' && (
                  <>
                    <button
                      onClick={() => router.push(`/branch-manager/${manager.id}/edit`)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded"
                      title="Edit Manager"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteManager(manager.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                      title="Delete Manager"
                    >
                      <FaTrash />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          
          {filteredManagers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FaUser className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg">No branch managers found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
