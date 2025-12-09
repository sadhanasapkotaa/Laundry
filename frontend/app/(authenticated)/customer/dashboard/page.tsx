"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { FiPackage, FiClock, FiUser, FiCreditCard } from "react-icons/fi";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import "../../../types/i18n";
import { orderAPI, Order, OrderStats } from "../../../services/orderService";
import { PaymentService } from "../../../services/paymentService";

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
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="animate-pulse flex items-center">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="ml-5 flex-1">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('customer.dashboard.welcomeBack')}, {user?.first_name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('customer.dashboard.whatsHappening')}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiPackage className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {t('customer.dashboard.activeOrders')}
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {displayStats.activeOrders}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiClock className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {t('customer.dashboard.completedOrders')}
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {displayStats.completedOrders}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiCreditCard className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {t('customer.dashboard.pendingPayments')}
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {displayStats.pendingPayments}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiUser className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Pending Amount
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  ₨ {displayStats.pendingAmount.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          {t('customer.dashboard.quickActions')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/customer/place-order"
            className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <FiPackage className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              {t('customer.dashboard.placeNewOrder')}
            </span>
          </Link>

          <Link
            href="/customer/orders"
            className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <FiClock className="h-6 w-6 text-green-600 mr-3" />
            <span className="text-green-700 dark:text-green-300 font-medium">
              {t('customer.dashboard.trackOrders')}
            </span>
          </Link>

          <Link
            href="/customer/payment"
            className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <FiCreditCard className="h-6 w-6 text-purple-600 mr-3" />
            <span className="text-purple-700 dark:text-purple-300 font-medium">
              Make Payment
            </span>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {t('customer.dashboard.recentOrders')}
          </h2>
          <Link
            href="/customer/orders"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
          >
            {t('customer.dashboard.viewAll')}
          </Link>
        </div>
        <div className="space-y-3">
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FiPackage className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No orders yet</p>
              <Link href="/customer/place-order" className="text-blue-600 hover:underline text-sm">
                Place your first order
              </Link>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiPackage className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {order.order_id}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.created ? new Date(order.created).toLocaleDateString() : order.order_date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    ₨ {order.total_amount?.toLocaleString()}
                  </p>
                  <p className={`text-sm capitalize ${order.status === 'completed' ? 'text-green-600' :
                    order.status === 'cancelled' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                    {order.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
