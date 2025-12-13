"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { FiPackage, FiClock, FiUser, FiCreditCard, FiArrowRight, FiActivity } from "react-icons/fi";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import "../../../types/i18n";
import { orderAPI, Order, OrderStats } from "../../../services/orderService";

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [stats, setStats] = useState<OrderStats['stats'] | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch stats and orders in parallel
        const [statsResponse, ordersData] = await Promise.all([
          orderAPI.getStats(),
          orderAPI.list(),
        ]);

        if (statsResponse.success) {
          setStats(statsResponse.stats);
        }

        // Get recent 5 orders sorted by date (newest first)
        const sortedOrders = [...(ordersData || [])]
          .sort((a, b) => new Date(b.created || b.order_date || '').getTime() - new Date(a.created || a.order_date || '').getTime())
          .slice(0, 5);
        setRecentOrders(sortedOrders);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Use stats from backend
  const displayStats = {
    activeOrders: stats?.active_orders || 0,
    completedOrders: stats?.completed_orders || 0,
    pendingPayments: stats?.pending_payments_count || 0,
    pendingAmount: stats?.pending_amount || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Hello, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user?.first_name || 'User'}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Here's what's happening with your laundry today.
          </p>
        </div>
        <Link href="/customer/place-order" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-transform active:scale-95 flex items-center gap-2">
          <FiPackage />
          Place New Order
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <FiActivity size={20} />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('customer.dashboard.activeOrders')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{displayStats.activeOrders}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:border-green-200 dark:hover:border-green-800 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
              <FiClock size={20} />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('customer.dashboard.completedOrders')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{displayStats.completedOrders}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:border-yellow-200 dark:hover:border-yellow-800 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform">
              <FiCreditCard size={20} />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Payments</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{displayStats.pendingPayments}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <FiUser size={20} />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Due</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">₨ {displayStats.pendingAmount.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('customer.dashboard.recentOrders')}
            </h2>
            <Link href="/customer/orders" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
              View All <FiArrowRight />
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {recentOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FiPackage className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No recent orders found</p>
                <Link href="/customer/place-order" className="text-blue-600 hover:underline text-sm font-medium mt-2 inline-block">Start your first order</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentOrders.map(order => (
                  <div key={order.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                        #{order.id.toString().slice(-2)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{order.branch_name || 'Branch Request'}</p>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <span>{order.created ? new Date(order.created).toLocaleDateString() : order.order_date}</span>
                          <span>•</span>
                          <span>{order.service_type || 'Standard Service'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize
                                            ${order.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                        {order.status}
                      </span>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">₨ {order.total_amount?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Promo */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Quick Actions
          </h2>
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Need a quick wash?</h3>
              <p className="text-purple-100 text-sm mb-6">Schedule a pickup now and get your clothes fresh and clean in no time.</p>
              <Link href="/customer/place-order" className="block w-full py-3 bg-white text-purple-700 font-bold text-center rounded-xl hover:bg-purple-50 transition-colors shadow-md">
                Place Order
              </Link>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-black/10 rounded-full blur-xl"></div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Total Pending</span>
                <span className="font-bold text-red-600">₨ {displayStats.pendingAmount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 dark:bg-gray-700">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: displayStats.activeOrders > 0 ? '70%' : '0%' }}></div>
              </div>
              <Link href="/customer/payment" className="block w-full py-2 text-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-800/50">
                Manage Payments
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
