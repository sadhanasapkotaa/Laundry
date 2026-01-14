"use client";

import "../../types/i18n";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FaDollarSign,
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaCreditCard,
  FaMoneyBillWave,
  FaChartLine,
  FaFilter,
  FaDownload,
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
import { API_CONFIG, getAuthHeaders, getFullUrl } from "../../config/api";

interface Income {
  id: number;
  branch: number;
  branch_name: string;
  branch_id_display: string;
  category: number;
  category_name: string;
  amount: string;
  description: string;
  date_received: string;
  payment_reference?: {
    transaction_uuid: string;
    amount: string;
    payment_type: string;
    status: string;
  };
}

interface Statistics {
  period: string;
  current_period: {
    total: number;
    count: number;
    average: number;
    start_date: string;
    end_date: string;
  };
  previous_period: {
    total: number;
    count: number;
    start_date: string;
    end_date: string;
  };
  growth_percentage: number;
  payment_methods: Record<string, number>;
}

interface TimeSeriesData {
  period: string;
  total: number;
  count: number;
}

const IncomeTracking = () => {
  const { t } = useTranslation();
  
  const [incomeRecords, setIncomeRecords] = useState<Income[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch(getFullUrl(API_CONFIG.ENDPOINTS.BRANCHES.LIST), {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setBranches(data.results || data);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };
    fetchBranches();
  }, []);

  // Fetch income data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch statistics
        const statsUrl = new URL(getFullUrl(API_CONFIG.ENDPOINTS.ACCOUNTING.INCOME.STATISTICS));
        statsUrl.searchParams.append('period', selectedPeriod);
        if (selectedBranch) {
          statsUrl.searchParams.append('branch', selectedBranch);
        }
        
        const statsResponse = await fetch(statsUrl.toString(), {
          headers: getAuthHeaders(),
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStatistics(statsData);
        }

        // Fetch time series data
        const timeUrl = new URL(getFullUrl(API_CONFIG.ENDPOINTS.ACCOUNTING.INCOME.BY_TIME));
        timeUrl.searchParams.append('period', selectedPeriod);
        if (selectedBranch) {
          timeUrl.searchParams.append('branch', selectedBranch);
        }
        
        const timeResponse = await fetch(timeUrl.toString(), {
          headers: getAuthHeaders(),
        });
        
        if (timeResponse.ok) {
          const timeData = await timeResponse.json();
          setTimeSeriesData(timeData);
        }

        // Fetch recent income records
        const incomeUrl = new URL(getFullUrl(API_CONFIG.ENDPOINTS.ACCOUNTING.INCOME.LIST));
        if (selectedBranch) {
          incomeUrl.searchParams.append('branch', selectedBranch);
        }
        incomeUrl.searchParams.append('page_size', '10');
        
        const incomeResponse = await fetch(incomeUrl.toString(), {
          headers: getAuthHeaders(),
        });
        
        if (incomeResponse.ok) {
          const incomeData = await incomeResponse.json();
          setIncomeRecords(incomeData.results || incomeData);
        }
      } catch (error) {
        console.error('Error fetching income data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod, selectedBranch]);

  // Calculate totals
  const totalIncome = statistics?.current_period?.total || 0;
  const previousIncome = statistics?.previous_period?.total || 0;
  const growthPercentage = statistics?.growth_percentage || 0;
  const averageIncome = statistics?.current_period?.average || 0;

  // Prepare payment method chart data
  const paymentMethodData = statistics?.payment_methods
    ? Object.entries(statistics.payment_methods).map(([method, value]) => ({
        name: method === 'cash' ? 'Cash' : method === 'esewa' ? 'eSewa' : 'Bank',
        value: value,
        color: method === 'cash' ? '#10B981' : method === 'esewa' ? '#3B82F6' : '#F59E0B',
      }))
    : [];

  // Prepare chart data for time series
  const chartData = timeSeriesData.map(item => ({
    name: formatPeriodLabel(item.period, selectedPeriod),
    income: parseFloat(item.total.toString()),
    count: item.count,
  })).reverse();

  function formatPeriodLabel(period: string, periodType: string): string {
    const date = new Date(period);
    if (periodType === 'daily') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (periodType === 'weekly') {
      return `Week ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (periodType === 'monthly') {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else {
      return date.getFullYear().toString();
    }
  }

  function formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₨ ${num.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading income data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 pt-16 md:pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{t("income.title")}</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2 border rounded-lg p-1">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-1 rounded-md transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 border rounded-lg shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t("income.totalIncome")}</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
              <div className="flex items-center mt-2 text-sm">
                {growthPercentage >= 0 ? (
                  <FaArrowTrendUp className="text-green-500 mr-1" />
                ) : (
                  <FaArrowTrendDown className="text-red-500 mr-1" />
                )}
                <span className={growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(growthPercentage).toFixed(1)}% vs previous period
                </span>
              </div>
            </div>
            <FaDollarSign className="text-green-500 text-3xl" />
          </div>
        </div>

        <div className="p-6 border rounded-lg shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Previous Period</p>
              <p className="text-2xl font-bold text-gray-700">{formatCurrency(previousIncome)}</p>
              <p className="text-sm text-gray-500 mt-2">
                {statistics?.previous_period?.count || 0} transactions
              </p>
            </div>
            <FaChartLine className="text-gray-500 text-3xl" />
          </div>
        </div>

        <div className="p-6 border rounded-lg shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t("income.dailyAverage")}</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(averageIncome)}</p>
              <p className="text-sm text-gray-500 mt-2">Per transaction</p>
            </div>
            <FaArrowTrendUp className="text-purple-500 text-3xl" />
          </div>
        </div>

        <div className="p-6 border rounded-lg shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-blue-600">{statistics?.current_period?.count || 0}</p>
              <p className="text-sm text-gray-500 mt-2">
                {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
              </p>
            </div>
            <FaCreditCard className="text-blue-500 text-3xl" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Distribution */}
        {paymentMethodData.length > 0 && (
          <div className="p-6 border rounded-lg shadow-sm bg-white">
            <h2 className="text-lg font-semibold mb-4">Payment Method Distribution</h2>
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
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Income Trend */}
        <div className="p-6 border rounded-lg shadow-sm bg-white">
          <h2 className="text-lg font-semibold mb-4">Income Trend ({selectedPeriod})</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="income" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Income Records */}
      <div className="p-6 border rounded-lg shadow-sm bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Income Records</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <FaDownload />
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Branch</th>
                <th className="text-left py-2">Category</th>
                <th className="text-left py-2">Description</th>
                <th className="text-left py-2">Payment Type</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {incomeRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No income records found
                  </td>
                </tr>
              ) : (
                incomeRecords.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      {new Date(record.date_received).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3">{record.branch_name}</td>
                    <td className="py-3">{record.category_name}</td>
                    <td className="py-3 max-w-xs truncate">{record.description || '-'}</td>
                    <td className="py-3">
                      {record.payment_reference ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            record.payment_reference.payment_type === 'cash'
                              ? 'bg-green-100 text-green-800'
                              : record.payment_reference.payment_type === 'esewa'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {record.payment_reference.payment_type === 'cash' ? (
                            <FaMoneyBillWave />
                          ) : record.payment_reference.payment_type === 'esewa' ? (
                            <FaDollarSign />
                          ) : (
                            <FaCreditCard />
                          )}
                          {record.payment_reference.payment_type}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">Manual Entry</span>
                      )}
                    </td>
                    <td className="py-3 text-right font-semibold">{formatCurrency(record.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IncomeTracking;
