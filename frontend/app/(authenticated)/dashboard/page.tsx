"use client"
import "../../types/i18n";
import api from '../../queries/api';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../queries/authQueries';
import { usePermission, ROLE_DISPLAY_NAMES } from '../../hooks/usePermissions';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FiPackage,
  FiDollarSign,
  FiTruck,
  FiTrendingUp,
  FiUsers,
  FiShield,
  // FiBuilding,
} from 'react-icons/fi';

// ---------- Types ----------
interface DailyOrdersItem {
  day: string;
  orders: number;
  income: number;
}

interface ServiceSlice {
  name: string;
  value: number;
  color: string;
}

interface BranchPerf {
  branch: string;
  orders: number;
  income: number;
}

interface StatItem {
  title: string;
  value: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

// ---------- Small UI primitives (Tailwind) ----------
const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white/70 dark:bg-slate-900/60 shadow-sm backdrop-blur ${className}`}>{children}</div>
);

const CardHeader: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <div className={`p-5 border-b border-slate-100 dark:border-slate-800 ${className}`}>{children}</div>
);

const CardTitle: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <h3 className={`text-lg font-semibold tracking-tight ${className}`}>{children}</h3>
);

const CardDescription: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <p className={`text-sm text-slate-500 dark:text-slate-400 ${className}`}>{children}</p>
);

const CardContent: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

const Badge: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 ${className}`}>{children}</span>
);

// ---------- Main Dashboard ----------
const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [dateLabel, setDateLabel] = useState('');

  // Permission checks
  const canViewFinancials = usePermission('canViewFinancials');
  const canViewAllOrders = usePermission('canViewAllOrders');
  const canViewAllBranches = usePermission('canViewAllBranches');
  const canViewReports = usePermission('canViewReports');

  // Set up date formatting on client side (must be before early returns)
  useEffect(() => {
    const today = new Date();
    const locale = i18n?.language === 'np' ? 'ne-NP' : 'en-US';
    const formattedDate = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(today);
    setDateLabel(formattedDate);
  }, [i18n?.language]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiShield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  // Dashboard State
  const [timeRange, setTimeRange] = useState('7d');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Dashboard Data
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
      setError(null);
      // Use the configured api instance which handles tokens
      const response = await api.get(`/orders/stats/?range=${timeRange}`);
      setDashboardData(response.data);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data", err);
      // Handle axios error
      const errorMessage = err.response?.data?.detail ||
        err.response?.statusText ||
        "Network or Server Error";
      setError(`Failed to load data: ${errorMessage}`);
    } finally {
      setLoadingData(false);
    }
  };

  // Process API data or fallback to empty
  const chartData = dashboardData?.chart_data || [];
  const serviceStats = dashboardData?.service_distribution?.map((item: any, index: number) => ({
    ...item,
    color: ['#6366f1', '#22c55e', '#f59e0b', '#f97316', '#8b5cf6'][index % 5]
  })) || [];
  const branchStats = dashboardData?.branch_performance || [];
  const recentActivity = dashboardData?.recent_activity?.map((item: any) => ({
    ...item,
    time: new Date(item.time).toLocaleString() // Format time on client
  })) || [];

  // Calculate totals from API stats
  const totalOrders = dashboardData?.stats?.total_orders || 0;
  const totalIncome = dashboardData?.stats?.total_income || 0;
  const activeOrders = dashboardData?.stats?.active_orders || 0;

  // Role-based stats filtering (Connected to Real Data)
  const getFilteredStats = (): StatItem[] => {
    const baseStats: StatItem[] = [
      {
        title: t('dashboard.totalOrders'),
        value: totalOrders.toString(),
        icon: FiPackage,
        change: '', // Trend comparison requires more historical data, simplified for now
        changeType: 'neutral',
      },
    ];

    if (canViewFinancials) {
      baseStats.push({
        title: t('dashboard.totalIncome'), // Label changed from daily to total for the range
        value: `₨ ${totalIncome.toLocaleString()}`,
        icon: FiDollarSign,
        change: '',
        changeType: 'positive',
      });
    }

    if (canViewAllBranches) {
      baseStats.push({
        title: t('dashboard.activeBranches'),
        value: branchStats.length.toString(), // Count of reporting branches
        icon: FiUsers,
        change: '',
        changeType: 'neutral',
      });
    }

    baseStats.push({
      title: t('dashboard.activeOrders'),
      value: activeOrders.toString(),
      icon: FiTruck,
      change: '',
      changeType: 'neutral',
    });

    return baseStats;
  };

  const stats = getFilteredStats();

  return (
    <div className="space-y-6 p-4 md:p-6 pt-16 md:pt-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {user?.first_name} {user?.last_name} ({ROLE_DISPLAY_NAMES[user?.role || 'customer']})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border text-sm rounded-lg p-2.5 shadow-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="1m">This Month</option>
            <option value="1y">This Year</option>
          </select>
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
            {dateLabel || 'Loading...'}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loadingData ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((s, idx) => {
              const Icon = s.icon;
              return (
                <Card key={idx} className="overflow-hidden">
                  <div className={`h-1 bg-indigo-500`} />
                  <CardContent className="flex items-center gap-4">
                    <div className="shrink-0 rounded-xl p-3 bg-slate-100 dark:bg-slate-800">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 dark:text-slate-400">{s.title}</p>
                      <div className="mt-1 text-2xl font-semibold">{s.value}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          {(canViewReports || canViewFinancials) && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Income/Orders Trend */}
              {canViewReports && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboard.charts.trends') || "Trends"}</CardTitle>
                    <CardDescription>Orders & Income over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[320px] w-full">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                            <Tooltip wrapperStyle={{ outline: 'none' }} />
                            <Bar yAxisId="left" dataKey="orders" name="Orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Service Distribution */}
              {canViewReports && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboard.charts.serviceDistribution')}</CardTitle>
                    <CardDescription>Top services by order volume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[320px] w-full">
                      {serviceStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={serviceStats}
                              cx="50%"
                              cy="50%"
                              outerRadius={95}
                              dataKey="value"
                              nameKey="name"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {serviceStats.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip wrapperStyle={{ outline: 'none' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Branch Performance */}
          {canViewAllBranches && (
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.branchPerformance')}</CardTitle>
                <CardDescription>Performance breakdown by branch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {branchStats.map((b: BranchPerf, i: number) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg p-2 bg-slate-100 dark:bg-slate-800">
                          <FiUsers className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{b.branch}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{b.orders} Orders</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-semibold">₨ {b.income.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {branchStats.length === 0 && <div className="text-center text-gray-500">No branch data</div>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
              <CardDescription>Most recent actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((a: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3"
                  >
                    <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
                    <div className="flex-1">
                      <p className="text-sm">{a.action}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{a.time}</p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && <div className="text-center text-gray-500">No recent activity</div>}
              </div>
            </CardContent>
          </Card>
        </>
      )
      }
    </div >
  );
};

export default Dashboard;
