"use client"

import React, { useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaDownload,
  FaMoneyBillWave,
  FaCreditCard,
  FaChartLine,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface IncomeEntry {
  id: string;
  amount: number;
  type: string;
  branch: string;
  customerId?: string;
  customerName?: string;
  mode: "cash" | "online";
  remarks?: string;
  date: string;
  addedBy: string;
  orderId?: string;
}

export default function IncomeTracking() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Mock Data
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([
    {
      id: "INC-001",
      amount: 850,
      type: "Wash & Fold",
      branch: "Main Branch",
      customerName: "Ram Sharma",
      mode: "cash",
      date: "2025-01-06",
      addedBy: "John Manager",
      orderId: "ORD-001",
    },
    {
      id: "INC-002",
      amount: 1200,
      type: "Dry Cleaning",
      branch: "Main Branch",
      customerName: "Sita Rai",
      mode: "online",
      date: "2025-01-05",
      addedBy: "System",
      orderId: "ORD-002",
    },
    {
      id: "INC-003",
      amount: 450,
      type: "Iron Only",
      branch: "Downtown Branch",
      customerName: "Maya Gurung",
      mode: "cash",
      date: "2025-01-05",
      addedBy: "Sarah Accountant",
    },
    {
      id: "INC-004",
      amount: 950,
      type: "Express Wash",
      branch: "Mall Branch",
      customerName: "John Doe",
      mode: "online",
      date: "2025-01-04",
      addedBy: "System",
      orderId: "ORD-003",
    },
  ]);

  const filteredEntries = incomeEntries.filter((entry) => {
    const matchesSearch =
      entry.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = modeFilter === "all" || entry.mode === modeFilter;
    const matchesType = typeFilter === "all" || entry.type === typeFilter;
    return matchesSearch && matchesMode && matchesType;
  });

  const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0);
  const cashIncome = incomeEntries
    .filter((e) => e.mode === "cash")
    .reduce((sum, e) => sum + e.amount, 0);
  const onlineIncome = incomeEntries
    .filter((e) => e.mode === "online")
    .reduce((sum, e) => sum + e.amount, 0);

  const dailyIncomeData = [
    { date: "2025-01-01", amount: 2400 },
    { date: "2025-01-02", amount: 3200 },
    { date: "2025-01-03", amount: 2800 },
    { date: "2025-01-04", amount: 3800 },
    { date: "2025-01-05", amount: 4200 },
    { date: "2025-01-06", amount: 3600 },
  ];

  const paymentModeData = [
    { name: "Cash", value: cashIncome },
    { name: "Online", value: onlineIncome },
  ];

  const colors = ["#8884d8", "#82ca9d"];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Income Tracking</h1>
        <div className="flex gap-2">
          <button className="flex items-center px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100">
            <FaDownload className="mr-2" /> Export
          </button>
          <button
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            onClick={() => setIsModalOpen(true)}
          >
            <FaPlus className="mr-2" /> Add Income
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl shadow bg-white">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Total Income</p>
            <FaChartLine className="text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold mt-2">₨ {totalIncome.toLocaleString()}</h2>
        </div>
        <div className="p-4 rounded-xl shadow bg-white">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Cash Payments</p>
            <FaMoneyBillWave className="text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold mt-2">₨ {cashIncome.toLocaleString()}</h2>
          <p className="text-xs text-gray-500">
            {((cashIncome / totalIncome) * 100).toFixed(1)}% of total
          </p>
        </div>
        <div className="p-4 rounded-xl shadow bg-white">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Online Payments</p>
            <FaCreditCard className="text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold mt-2">₨ {onlineIncome.toLocaleString()}</h2>
          <p className="text-xs text-gray-500">
            {((onlineIncome / totalIncome) * 100).toFixed(1)}% of total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 shadow rounded-lg flex gap-4 items-center">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search income..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">All Modes</option>
          <option value="cash">Cash</option>
          <option value="online">Online</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">All Services</option>
          {[...new Set(incomeEntries.map((e) => e.type))].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Date</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Service</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Mode</th>
              <th className="p-3">Branch</th>
              <th className="p-3">Added By</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="border-t">
                <td className="p-3 font-medium">{entry.id}</td>
                <td className="p-3">{entry.date}</td>
                <td className="p-3">{entry.customerName || "N/A"}</td>
                <td className="p-3">{entry.type}</td>
                <td className="p-3 font-semibold">₨ {entry.amount}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      entry.mode === "cash"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {entry.mode}
                  </span>
                </td>
                <td className="p-3">{entry.branch}</td>
                <td className="p-3">{entry.addedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Daily Income</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyIncomeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Payment Mode</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentModeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentModeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Add Income Entry</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsModalOpen(false);
              }}
              className="space-y-4"
            >
              <input
                type="number"
                placeholder="Amount (₨)"
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Service Type"
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Branch"
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <select className="w-full px-3 py-2 border rounded-lg">
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border px-4 py-2 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
