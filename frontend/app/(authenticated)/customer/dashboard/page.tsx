"use client";

import React from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { FiPackage, FiClock, FiUser, FiCreditCard } from "react-icons/fi";
import Link from "next/link";

export default function CustomerDashboardPage() {
  const { user } = useAuth();

  // Mock data - replace with actual API calls
  const stats = {
    activeOrders: 2,
    completedOrders: 15,
    pendingPayments: 1,
    totalSpent: 3420,
  };

  const recentOrders = [
    {
      id: "ORD-001",
      status: "processing",
      date: "2024-12-20",
      total: 450,
    },
    {
      id: "ORD-002",
      status: "completed",
      date: "2024-12-18",
      total: 650,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here's what's happening with your laundry orders.
        </p>
      </div>

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
                  Active Orders
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {stats.activeOrders}
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
                  Completed Orders
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {stats.completedOrders}
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
                  Pending Payments
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {stats.pendingPayments}
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
                  Total Spent
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  ₨ {stats.totalSpent}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/customer/place-order"
            className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <FiPackage className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Place New Order
            </span>
          </Link>
          
          <Link
            href="/customer/orders"
            className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <FiClock className="h-6 w-6 text-green-600 mr-3" />
            <span className="text-green-700 dark:text-green-300 font-medium">
              Track Orders
            </span>
          </Link>
          
          <Link
            href="/customer/payment-history"
            className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <FiCreditCard className="h-6 w-6 text-purple-600 mr-3" />
            <span className="text-purple-700 dark:text-purple-300 font-medium">
              Payment History
            </span>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Recent Orders
          </h2>
          <Link
            href="/customer/orders"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
          >
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {recentOrders.map((order) => (
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
                    {order.id}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {order.date}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  ₨ {order.total}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {order.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
