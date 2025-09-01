"use client";

import "../../types/i18n";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaDollarSign,
  FaArrowTrendUp,
  FaCreditCard,
  FaMoneyBillWave,
  FaChartLine,
} from "react-icons/fa6";
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
  Legend,
} from "recharts";

interface IncomeRecord {
  id: string;
  date: string;
  amount: number;
  paymentMethod: "cash" | "online" | "card";
  branchId: string;
  branchName: string;
  orderId: string;
  customerName: string;
  serviceType: string;
}

const IncomeTracking = () => {
  const { t } = useTranslation();

  const [incomeRecords] = useState<IncomeRecord[]>([
    {
      id: "INC-001",
      date: "2025-01-06",
      amount: 1200,
      paymentMethod: "card",
      branchId: "BR-001",
      branchName: "Main Branch",
      orderId: "ORD-001",
      customerName: "Ram Sharma",
      serviceType: "Dry Cleaning",
    },
    {
      id: "INC-002",
      date: "2025-01-06",
      amount: 850,
      paymentMethod: "cash",
      branchId: "BR-001",
      branchName: "Main Branch",
      orderId: "ORD-002",
      customerName: "Sita Rai",
      serviceType: "Wash & Fold",
    },
    {
      id: "INC-003",
      date: "2025-01-05",
      amount: 950,
      paymentMethod: "online",
      branchId: "BR-002",
      branchName: "Downtown Branch",
      orderId: "ORD-003",
      customerName: "John Doe",
      serviceType: "Express Wash",
    },
  ]);

  const totalIncome = incomeRecords.reduce((sum, record) => sum + record.amount, 0);
  const monthlyTarget = 150000;
  const dailyAverage = totalIncome / 7; // Assuming 7 days

  const paymentMethodData = [
    { name: t("income.cash"), value: incomeRecords.filter(r => r.paymentMethod === "cash").reduce((sum, r) => sum + r.amount, 0), color: "#10B981" },
    { name: t("income.online"), value: incomeRecords.filter(r => r.paymentMethod === "online").reduce((sum, r) => sum + r.amount, 0), color: "#3B82F6" },
    { name: t("income.card"), value: incomeRecords.filter(r => r.paymentMethod === "card").reduce((sum, r) => sum + r.amount, 0), color: "#F59E0B" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 pt-16 md:pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("income.title")}</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border rounded-lg shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t("income.totalIncome")}</p>
              <p className="text-2xl font-bold text-green-600">₨ {totalIncome.toLocaleString()}</p>
            </div>
            <FaDollarSign className="text-green-500 text-2xl" />
          </div>
        </div>

        <div className="p-6 border rounded-lg shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t("income.monthlyTarget")}</p>
              <p className="text-2xl font-bold text-blue-600">₨ {monthlyTarget.toLocaleString()}</p>
            </div>
            <FaArrowTrendUp className="text-blue-500 text-2xl" />
          </div>
        </div>

        <div className="p-6 border rounded-lg shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t("income.dailyAverage")}</p>
              <p className="text-2xl font-bold text-purple-600">₨ {Math.round(dailyAverage).toLocaleString()}</p>
            </div>
            <FaChartLine className="text-purple-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* Payment Method Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg shadow-sm bg-white">
          <h2 className="text-lg font-semibold mb-4">{t("income.paymentMethod")} Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 border rounded-lg shadow-sm bg-white">
          <h2 className="text-lg font-semibold mb-4">Daily Income Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { day: "Mon", income: 2500 },
                { day: "Tue", income: 3200 },
                { day: "Wed", income: 2800 },
                { day: "Thu", income: 3500 },
                { day: "Fri", income: 4100 },
                { day: "Sat", income: 4800 },
                { day: "Sun", income: 3000 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Income Records */}
      <div className="p-6 border rounded-lg shadow-sm bg-white">
        <h2 className="text-lg font-semibold mb-4">Recent Income Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Order ID</th>
                <th className="text-left py-2">Customer</th>
                <th className="text-left py-2">Service</th>
                <th className="text-left py-2">Payment Method</th>
                <th className="text-left py-2">Branch</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {incomeRecords.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{record.date}</td>
                  <td className="py-3">{record.orderId}</td>
                  <td className="py-3">{record.customerName}</td>
                  <td className="py-3">{record.serviceType}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      record.paymentMethod === "cash" ? "bg-green-100 text-green-800" :
                      record.paymentMethod === "online" ? "bg-blue-100 text-blue-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {record.paymentMethod === "cash" ? <FaMoneyBillWave /> :
                       record.paymentMethod === "online" ? <FaDollarSign /> :
                       <FaCreditCard />}
                      {t(`income.${record.paymentMethod}`)}
                    </span>
                  </td>
                  <td className="py-3">{record.branchName}</td>
                  <td className="py-3 text-right font-semibold">₨ {record.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IncomeTracking;
