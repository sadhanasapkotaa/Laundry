"use client"
import React, { useState } from "react";
import { FiUser, FiPackage, FiSearch, FiPlus, FiPhone, FiMail, FiCalendar } from "react-icons/fi";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Legend } from "recharts";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  branchId: string;
  branchName: string;
  registrationDate: string;
  lastOrderDate?: string;
  totalOrders: number;
  totalSpent: number;
  status: "active" | "inactive" | "vip";
  preferredServices: string[];
  notes?: string;
  loyaltyPoints: number;
}

const branches = [
  { id: "BR-001", name: "Main Branch" },
  { id: "BR-002", name: "Downtown Branch" },
  { id: "BR-003", name: "Mall Branch" },
  { id: "BR-004", name: "Airport Branch" },
];

const mockClients: Client[] = [
  {
    id: "CUST-001",
    name: "Ram Sharma",
    email: "ram.sharma@email.com",
    phone: "+977-9841234567",
    address: "Thamel, Ward 29",
    city: "Kathmandu",
    branchId: "BR-001",
    branchName: "Main Branch",
    registrationDate: "2024-01-15",
    lastOrderDate: "2025-01-06",
    totalOrders: 25,
    totalSpent: 15750,
    status: "vip",
    preferredServices: ["Wash & Fold", "Dry Cleaning"],
    notes: "VIP customer, prefers express service",
    loyaltyPoints: 157,
  },
  {
    id: "CUST-002",
    name: "Sita Rai",
    email: "sita.rai@email.com",
    phone: "+977-9851234567",
    address: "Patan Durbar Square",
    city: "Lalitpur",
    branchId: "BR-002",
    branchName: "Downtown Branch",
    registrationDate: "2024-02-10",
    lastOrderDate: "2025-01-05",
    totalOrders: 18,
    totalSpent: 12400,
    status: "active",
    preferredServices: ["Dry Cleaning", "Iron Only"],
    loyaltyPoints: 124,
  },
  {
    id: "CUST-003",
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "+977-9861234567",
    address: "Boudhanath Stupa Area",
    city: "Kathmandu",
    branchId: "BR-001",
    branchName: "Main Branch",
    registrationDate: "2024-03-22",
    lastOrderDate: "2025-01-04",
    totalOrders: 12,
    totalSpent: 8950,
    status: "active",
    preferredServices: ["Express Wash", "Wash & Fold"],
    loyaltyPoints: 89,
  },
];

const COLORS = ["#7e22ce", "#16a34a", "#6b7280"];

export default function ClientDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "vip">("all");
  const [branchFilter, setBranchFilter] = useState<"all" | string>("all");

  const filteredClients = mockClients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesBranch = branchFilter === "all" || client.branchId === branchFilter;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const totalClients = mockClients.length;
  const activeClients = mockClients.filter((c) => c.status === "active" || c.status === "vip").length;
  const vipClients = mockClients.filter((c) => c.status === "vip").length;
  const totalRevenue = mockClients.reduce((sum, c) => sum + c.totalSpent, 0);

  const statusData = [
    { name: "VIP", value: vipClients },
    { name: "Active", value: activeClients - vipClients },
    { name: "Inactive", value: totalClients - activeClients },
  ];

  const branchRevenueData = branches.map((branch) => {
    const revenue = mockClients.filter((c) => c.branchId === branch.id).reduce((sum, c) => sum + c.totalSpent, 0);
    return { branch: branch.name, revenue };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Client Dashboard</h1>
        <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          <FiPlus /> Add Client
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow flex flex-col">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Clients</span>
            <FiUser />
          </div>
          <div className="text-2xl font-bold">{totalClients}</div>
          <div className="text-xs text-gray-500">{activeClients} active</div>
        </div>

        <div className="bg-white p-4 rounded shadow flex flex-col">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">VIP Clients</span>
            <FiUser />
          </div>
          <div className="text-2xl font-bold">{vipClients}</div>
          <div className="text-xs text-gray-500">{((vipClients / totalClients) * 100).toFixed(1)}%</div>
        </div>

        <div className="bg-white p-4 rounded shadow flex flex-col">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Revenue</span>
            <FiPackage />
          </div>
          <div className="text-2xl font-bold">₨ {totalRevenue.toLocaleString()}</div>
        </div>

        <div className="bg-white p-4 rounded shadow flex flex-col">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Avg Order Value</span>
            <FiPackage />
          </div>
          <div className="text-2xl font-bold">
            ₨ {Math.round(totalRevenue / mockClients.reduce((sum, c) => sum + c.totalOrders, 0)).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-medium mb-2">Client Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80} label>
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-medium mb-2">Revenue by Branch</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={branchRevenueData}>
              <XAxis dataKey="branch" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#7e22ce" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 border rounded p-2"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive" | "vip")}
          className="border rounded p-2"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="vip">VIP</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="border rounded p-2"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Clients Table */}
      <div className="overflow-x-auto">
        <table className="w-full border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Client</th>
              <th className="p-2 text-left">Contact</th>
              <th className="p-2 text-left">Branch</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Orders</th>
              <th className="p-2 text-left">Total Spent</th>
              <th className="p-2 text-left">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{client.name}</td>
                <td className="p-2">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1">
                      <FiPhone /> {client.phone}
                    </span>
                    {client.email && (
                      <span className="flex items-center gap-1 text-gray-500">
                        <FiMail /> {client.email}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-2">{client.branchName}</td>
                <td className={`p-2 font-medium ${client.status === "vip" ? "text-purple-600" : client.status === "active" ? "text-green-600" : "text-gray-500"}`}>
                  {client.status.toUpperCase()}
                </td>
                <td className="p-2">{client.totalOrders}</td>
                <td className="p-2">₨ {client.totalSpent.toLocaleString()}</td>
                <td className="p-2">{client.lastOrderDate || "Never"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
