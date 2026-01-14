"use client";

import "../../types/i18n";
import React, { useState, useEffect, useCallback } from 'react';
import { FaMoneyBillWave, FaPlus, FaTimes, FaFilter, FaSearch, FaEdit, FaTrash, FaTags } from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Branch {
  id: number;
  name: string;
  branch_id: string;
  city: string;
  status: string;
}

interface ExpenseCategory {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  category: number;
  category_name: string;
  branch: number;
  branch_name: string;
  branch_id_display: string;
  amount: number;
  description: string;
  date_incurred: string;
}

interface NewExpense {
  category: number | '';
  branch: number | '';
  amount: number;
  description: string;
  date_incurred: string;
}

interface FilterOptions {
  branch: number | '';
  category: number | '';
  date_from: string;
  date_to: string;
  search: string;
}

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#F97316'];

export default function ExpenseTracking() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [newExpense, setNewExpense] = useState<NewExpense>({
    category: '',
    branch: '',
    amount: 0,
    description: '',
    date_incurred: new Date().toISOString().split('T')[0],
  });

  const [filters, setFilters] = useState<FilterOptions>({
    branch: '',
    category: '',
    date_from: '',
    date_to: '',
    search: '',
  });

  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);

  // API base URL - adjust this to match your backend
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/accounting/expenses/`);
      const result = await response.json();
      setExpenses(result.results || result || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  }, [API_BASE]);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch accounting data (branches and categories)
      const dataResponse = await fetch(`${API_BASE}/accounting/data/`);
      const dataResult = await dataResponse.json();

      if (dataResult.branches) {
        // Filter only active branches
        const activeBranches = (dataResult.branches || []).filter((branch: Branch) => branch.status === 'active');
        setBranches(activeBranches);
      }
      if (dataResult.expense_categories) setCategories(dataResult.expense_categories);

      // Fetch expenses
      await fetchExpenses();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, fetchExpenses]);

  const applyFilters = useCallback(() => {
    let result = [...expenses];

    // Apply branch filter
    if (filters.branch) {
      result = result.filter(ex => ex.branch.toString() === filters.branch.toString());
    }

    // Apply category filter
    if (filters.category) {
      result = result.filter(ex => ex.category.toString() === filters.category.toString());
    }

    // Apply date range filter
    if (filters.date_from) {
      result = result.filter(ex => ex.date_incurred >= filters.date_from);
    }
    if (filters.date_to) {
      result = result.filter(ex => ex.date_incurred <= filters.date_to);
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(ex =>
        ex.description?.toLowerCase().includes(searchLower) ||
        ex.category_name.toLowerCase().includes(searchLower) ||
        ex.branch_name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredExpenses(result);
  }, [expenses, filters]);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Apply filters when expenses or filters change
  useEffect(() => {
    applyFilters();
  }, [expenses, filters, applyFilters]);

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.branch || !newExpense.amount || !newExpense.date_incurred) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const method = editingExpense ? 'PUT' : 'POST';
      const url = editingExpense
        ? `${API_BASE}/accounting/expenses/${editingExpense.id}/`
        : `${API_BASE}/accounting/expenses/`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExpense),
      });

      if (response.ok) {
        await fetchExpenses();
        resetForm();
        setIsModalOpen(false);
      } else {
        const errorData = await response.json();
        alert('Error saving expense: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error saving expense');
    }
  };

  const handleEditExpense = async (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      category: expense.category,
      branch: expense.branch,
      amount: expense.amount,
      description: expense.description,
      date_incurred: expense.date_incurred,
    });
    await refreshDropdownData();
    setIsModalOpen(true);
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const response = await fetch(`${API_BASE}/accounting/expenses/${expenseId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchExpenses();
      } else {
        alert('Error deleting expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Error deleting expense');
    }
  };

  const resetForm = () => {
    setNewExpense({
      category: '',
      branch: '',
      amount: 0,
      description: '',
      date_incurred: new Date().toISOString().split('T')[0],
    });
    setEditingExpense(null);
  };

  const refreshDropdownData = async () => {
    try {
      // Fetch latest accounting data (branches and categories)
      const dataResponse = await fetch(`${API_BASE}/accounting/data/`);
      const dataResult = await dataResponse.json();

      console.log('Refreshed data:', dataResult); // Debug log

      // Filter only active branches
      const activeBranches = (dataResult.branches || []).filter((branch: Branch) => branch.status === 'active');
      setBranches(activeBranches);
      setCategories(dataResult.expense_categories || []);

      console.log('Active branches:', activeBranches); // Debug log
      console.log('Categories:', dataResult.expense_categories); // Debug log
    } catch (error) {
      console.error('Error refreshing dropdown data:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/accounting/expense-categories/`);
      const result = await response.json();
      setCategories(result.results || result || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory
        ? `${API_BASE}/accounting/expense-categories/${editingCategory.id}/`
        : `${API_BASE}/accounting/expense-categories/`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (response.ok) {
        await fetchCategories();
        resetCategoryForm();
        setIsCategoryModalOpen(false);
      } else {
        const errorData = await response.json();
        alert('Error saving category: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    }
  };

  const handleEditCategory = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

    try {
      const response = await fetch(`${API_BASE}/accounting/expense-categories/${categoryId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCategories();
      } else {
        alert('Error deleting category. It may be in use by existing expenses.');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  const resetCategoryForm = () => {
    setNewCategoryName('');
    setEditingCategory(null);
  };

  const clearFilters = () => {
    setFilters({
      branch: '',
      category: '',
      date_from: '',
      date_to: '',
      search: '',
    });
  };

  const expenseSummary = filteredExpenses.reduce((acc, curr) => {
    acc[curr.category_name] = (acc[curr.category_name] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(expenseSummary).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FaMoneyBillWave className="text-emerald-500" />
          Expense Tracking
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
          >
            <FaFilter /> Filters
          </button>
          <button
            onClick={() => {
              resetCategoryForm();
              setIsCategoryModalOpen(true);
            }}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow"
          >
            <FaTags /> Manage Categories
          </button>
          <button
            onClick={async () => {
              resetForm();
              await refreshDropdownData();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow"
          >
            <FaPlus /> Add Expense
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {isFilterOpen && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Branch</label>
              <select
                className="w-full border rounded-lg p-2"
                value={filters.branch}
                onChange={(e) => setFilters({ ...filters, branch: e.target.value ? Number(e.target.value) : '' })}
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.branch_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                className="w-full border rounded-lg p-2"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value ? Number(e.target.value) : '' })}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <input
                type="date"
                className="w-full border rounded-lg p-2"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                className="w-full border rounded-lg p-2"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search description..."
                  className="w-full border rounded-lg p-2 pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-600">₨ {totalExpenses.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{filteredExpenses.length} transactions</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Categories</h3>
          <p className="text-3xl font-bold text-blue-600">{Object.keys(expenseSummary).length}</p>
          <p className="text-sm text-gray-500">Active categories</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Avg. Expense</h3>
          <p className="text-3xl font-bold text-green-600">
            ₨ {filteredExpenses.length > 0 ? Math.round(totalExpenses / filteredExpenses.length).toLocaleString() : 0}
          </p>
          <p className="text-sm text-gray-500">Per transaction</p>
        </div>
      </div>

      {/* Chart */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Expense Breakdown by Category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₨ ${Number(value).toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Expense List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Date</th>
                <th className="p-2">Branch</th>
                <th className="p-2">Category</th>
                <th className="p-2">Amount (₨)</th>
                <th className="p-2">Description</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{new Date(expense.date_incurred).toLocaleDateString()}</td>
                  <td className="p-2">
                    <div>
                      <div className="font-medium">{expense.branch_name}</div>
                      <div className="text-xs text-gray-500">{expense.branch_id_display}</div>
                    </div>
                  </td>
                  <td className="p-2 font-medium">{expense.category_name}</td>
                  <td className="p-2 font-bold text-red-600">₨ {expense.amount.toLocaleString()}</td>
                  <td className="p-2 text-gray-600">{expense.description || '-'}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredExpenses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No expenses found matching your filters.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              <FaTimes />
            </button>
            <h2 className="text-xl font-semibold mb-4">
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Branch *</label>
                <select
                  className="mt-1 w-full border rounded-lg p-2"
                  value={newExpense.branch}
                  onChange={(e) => setNewExpense({ ...newExpense, branch: e.target.value ? Number(e.target.value) : '' })}
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.branch_id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Category *</label>
                <select
                  className="mt-1 w-full border rounded-lg p-2"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value ? Number(e.target.value) : '' })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 w-full border rounded-lg p-2"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Date *</label>
                <input
                  type="date"
                  className="mt-1 w-full border rounded-lg p-2"
                  value={newExpense.date_incurred}
                  onChange={(e) => setNewExpense({ ...newExpense, date_incurred: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  className="mt-1 w-full border rounded-lg p-2"
                  rows={3}
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Enter expense description..."
                />
              </div>
              <button
                onClick={handleAddExpense}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg shadow"
              >
                {editingExpense ? 'Update Expense' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setIsCategoryModalOpen(false);
                resetCategoryForm();
              }}
            >
              <FaTimes />
            </button>
            <h2 className="text-xl font-semibold mb-4">Manage Expense Categories</h2>

            {/* Add/Edit Category Form */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-medium mb-3">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Category name"
                  className="flex-1 border rounded-lg p-2"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
                >
                  {editingCategory ? 'Update' : 'Add'}
                </button>
                {editingCategory && (
                  <button
                    onClick={resetCategoryForm}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Categories List */}
            <div className="max-h-60 overflow-y-auto">
              <h3 className="text-lg font-medium mb-3">Existing Categories</h3>
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No categories found</p>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <span className="font-medium">{category.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
