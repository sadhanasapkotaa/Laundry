"use client"
import "../../types/i18n";
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

  // Mock data with localized labels
  const dailyOrdersData: DailyOrdersItem[] = [
    { day: t('dashboard.days.mon'), orders: 45, income: 1250 },
    { day: t('dashboard.days.tue'), orders: 52, income: 1480 },
    { day: t('dashboard.days.wed'), orders: 38, income: 1120 },
    { day: t('dashboard.days.thu'), orders: 61, income: 1690 },
    { day: t('dashboard.days.fri'), orders: 55, income: 1560 },
    { day: t('dashboard.days.sat'), orders: 78, income: 2180 },
    { day: t('dashboard.days.sun'), orders: 42, income: 1190 },
  ];

  const serviceDistribution: ServiceSlice[] = [
    { name: t('dashboard.services.washFold'), value: 40, color: '#6366f1' },
    { name: t('dashboard.services.dryCleaning'), value: 30, color: '#22c55e' },
    { name: t('dashboard.services.ironOnly'), value: 20, color: '#f59e0b' },
    { name: t('dashboard.services.express'), value: 10, color: '#f97316' },
  ];

  const branchPerformance: BranchPerf[] = [
    { branch: t('dashboard.branches.mainBranch'), orders: 156, income: 4200 },
    { branch: t('dashboard.branches.downtown'), orders: 134, income: 3800 },
    { branch: t('dashboard.branches.mallBranch'), orders: 98, income: 2900 },
    { branch: t('dashboard.branches.airport'), orders: 87, income: 2400 },
  ];

  // Role-based stats filtering
  const getFilteredStats = (): StatItem[] => {
    const baseStats: StatItem[] = [
      {
        title: t('dashboard.totalOrders'),
        value: canViewAllOrders ? '475' : '12', // Show limited data for restricted roles
        icon: FiPackage,
        change: '+12%',
        changeType: 'positive',
      },
    ];

    if (canViewFinancials) {
      baseStats.push({
        title: t('dashboard.dailyIncome'),
        value: '₨ 15,300',
        icon: FiDollarSign,
        change: '+8%',
        changeType: 'positive',
      });
    }

    if (canViewAllBranches) {
      baseStats.push({
        title: t('dashboard.activeBranches'),
        value: '4',
        icon: FiUsers,
        change: '0%',
        changeType: 'neutral',
      });
    }

    baseStats.push({
      title: t('dashboard.pendingDeliveries'),
      value: '23',
      icon: FiTruck,
      change: '-15%',
      changeType: 'positive',
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
            {t('dashboard.title')} - {ROLE_DISPLAY_NAMES[user.role]}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Welcome back, {user.first_name} {user.last_name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
            {ROLE_DISPLAY_NAMES[user.role]}
          </Badge>
          <Badge>{dateLabel || 'Loading...'}</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          const color = s.changeType === 'positive' ? 'text-emerald-600' : s.changeType === 'negative' ? 'text-rose-600' : 'text-slate-500';
          const bg = s.changeType === 'positive' ? 'bg-emerald-50 dark:bg-emerald-950/30' : s.changeType === 'negative' ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-slate-50 dark:bg-slate-800/50';
          return (
            <Card key={idx} className="overflow-hidden">
              <div className={`h-1 ${s.changeType === 'positive' ? 'bg-emerald-500' : s.changeType === 'negative' ? 'bg-rose-500' : 'bg-slate-300'}`} />
              <CardContent className="flex items-center gap-4">
                <div className="shrink-0 rounded-xl p-3 bg-slate-100 dark:bg-slate-800">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{s.title}</p>
                  <div className="mt-1 text-2xl font-semibold">{s.value}</div>
                  <div className={`mt-1 inline-flex items-center text-xs font-medium ${color} ${bg} px-2 py-0.5 rounded-full`}>
                    <FiTrendingUp className="mr-1" /> {s.change} {t('dashboard.fromLastWeek')}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      {(canViewReports || canViewFinancials) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Daily Orders & Income */}
          {canViewReports && (
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.charts.dailyOrdersIncome')}</CardTitle>
                <CardDescription>{t('dashboard.charts.ordersRevenueWeek')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyOrdersData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <Tooltip wrapperStyle={{ outline: 'none' }} />
                      <Bar yAxisId="left" dataKey="orders" name={t('dashboard.charts.orders')} radius={[6, 6, 0, 0]} />
                      <Bar yAxisId="right" dataKey="income" name={t('dashboard.charts.incomeRs')} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Distribution */}
          {canViewReports && (
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.charts.serviceDistribution')}</CardTitle>
                <CardDescription>{t('dashboard.charts.serviceBreakdownMonth')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        dataKey="value"
                        nameKey="name"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {serviceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip wrapperStyle={{ outline: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
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
            <CardDescription>{t('dashboard.branchPerformanceDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {branchPerformance.map((b, i) => (
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
                      <p className="text-sm text-slate-500 dark:text-slate-400">{b.orders} {t('dashboard.ordersLabel')}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold">₨ {b.income.toLocaleString()}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.thisWeek')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          <CardDescription>{t('dashboard.recentActivityDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: t('dashboard.activity.time2min'), action: t('dashboard.activity.newOrder'), type: 'order' },
              { time: t('dashboard.activity.time5min'), action: t('dashboard.activity.paymentCompleted'), type: 'payment' },
              { time: t('dashboard.activity.time12min'), action: t('dashboard.activity.orderDelivered'), type: 'delivery' },
              { time: t('dashboard.activity.time25min'), action: t('dashboard.activity.customerRegistered'), type: 'customer' },
              { time: t('dashboard.activity.time1hour'), action: t('dashboard.activity.backupCompleted'), type: 'system' },
            ].map((a, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3"
              >
                <span
                  className={
                    `inline-block h-2 w-2 rounded-full ` +
                    (a.type === 'order'
                      ? 'bg-indigo-500'
                      : a.type === 'payment'
                        ? 'bg-emerald-500'
                        : a.type === 'delivery'
                          ? 'bg-orange-500'
                          : a.type === 'customer'
                            ? 'bg-purple-500'
                            : 'bg-slate-400')
                  }
                />
                <div className="flex-1">
                  <p className="text-sm">{a.action}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
