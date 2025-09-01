"use client";

import "../../types/i18n";
import React, { useState } from 'react';
import { FaMoneyBillWave, FaPlus, FaTimes } from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export default function ExpenseTracking() {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', category: 'Rent', amount: 25000, date: '2025-08-01' },
    { id: '2', category: 'Supplies', amount: 7500, date: '2025-08-03' },
    { id: '3', category: 'Utilities', amount: 4200, date: '2025-08-05' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Omit<Expense, 'id'>>({
    category: '',
    amount: 0,
    date: '',
    notes: '',
  });

  const handleAddExpense = () => {
    if (!newExpense.category || !newExpense.amount || !newExpense.date) return;
    setExpenses([
      ...expenses,
      { id: Date.now().toString(), ...newExpense },
    ]);
    setNewExpense({ category: '', amount: 0, date: '', notes: '' });
    setIsModalOpen(false);
  };

  const expenseSummary = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(expenseSummary).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FaMoneyBillWave className="text-emerald-500" />
          Expense Tracking
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow"
        >
          <FaPlus /> Add Expense
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Expense Breakdown</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Expense List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Category</th>
                <th className="p-2">Amount (₨)</th>
                <th className="p-2">Date</th>
                <th className="p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b">
                  <td className="p-2 font-medium">{expense.category}</td>
                  <td className="p-2">₨ {expense.amount.toLocaleString()}</td>
                  <td className="p-2">{expense.date}</td>
                  <td className="p-2 text-gray-600">{expense.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setIsModalOpen(false)}
            >
              <FaTimes />
            </button>
            <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Category</label>
                <input
                  type="text"
                  className="mt-1 w-full border rounded-lg p-2"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Amount</label>
                <input
                  type="number"
                  className="mt-1 w-full border rounded-lg p-2"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Date</label>
                <input
                  type="date"
                  className="mt-1 w-full border rounded-lg p-2"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Notes</label>
                <textarea
                  className="mt-1 w-full border rounded-lg p-2"
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                />
              </div>
              <button
                onClick={handleAddExpense}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg shadow"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
