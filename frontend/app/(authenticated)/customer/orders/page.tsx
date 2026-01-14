
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { FiPackage, FiClock, FiCheck, FiTruck, FiMapPin, FiCalendar, FiChevronDown, FiChevronUp, FiAlertCircle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import "../../../types/i18n";
import { orderAPI, Order } from "../../../services/orderService";
import Link from "next/link";

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Real orders from API
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to track which order is expanded
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Only set loading on first load to avoid flickering
        if (orders.length === 0) setLoading(true);
        const fetchedOrders = await orderAPI.list({ ordering: '-created' });
        setOrders(fetchedOrders);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        // Only show error if we don't have data
        if (orders.length === 0) setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
      // Poll every 10 seconds for updates
      const intervalId = setInterval(fetchOrders, 10000);
      return () => clearInterval(intervalId);
    }
  }, [user, orders.length]);

  const handleToggleDetails = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-400">
        <FiPackage className="h-10 w-10 animate-bounce mb-4 opacity-50" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  // Prevent hydration mismatch by not rendering until user is loaded on client
  if (typeof window !== 'undefined' && !user) {
    return null;
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "dropped by user":
        return { icon: FiPackage, color: "text-blue-600 bg-blue-50 border-blue-100", label: "Dropped by User" };
      case "pending pickup":
        return { icon: FiClock, color: "text-yellow-600 bg-yellow-50 border-yellow-100", label: "Pending Pickup" };
      case "picked up":
        return { icon: FiTruck, color: "text-indigo-600 bg-indigo-50 border-indigo-100", label: "Picked Up" };
      case "sent to wash":
        return { icon: FiPackage, color: "text-purple-600 bg-purple-50 border-purple-100", label: "Sent to Wash" };
      case "in wash":
        return { icon: FiPackage, color: "text-blue-500 bg-blue-50 border-blue-200 animate-pulse", label: "In Wash" };
      case "washed":
        return { icon: FiCheck, color: "text-teal-600 bg-teal-50 border-teal-100", label: "Washed" };
      case "picked by client":
        return { icon: FiCheck, color: "text-green-600 bg-green-50 border-green-100", label: "Picked by Client" };
      case "pending delivery":
        return { icon: FiClock, color: "text-orange-600 bg-orange-50 border-orange-100", label: "Pending Delivery" };
      case "delivered":
      case "completed":
        return { icon: FiCheck, color: "text-green-700 bg-green-100 border-green-200", label: "Delivered" };
      case "cancelled":
        return { icon: FiAlertCircle, color: "text-red-600 bg-red-50 border-red-100", label: "Cancelled" };
      case "refunded":
        return { icon: FiAlertCircle, color: "text-gray-600 bg-gray-100 border-gray-200", label: "Refunded" };
      default:
        return { icon: FiClock, color: "text-gray-500 bg-gray-50 border-gray-100", label: status };
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            My Orders
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Track and manage your recent laundry requests
          </p>
        </div>
        <Link
          href="/customer/place-order"
          className="px-6 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-full font-medium transition-all shadow-lg shadow-gray-200 dark:shadow-none translate-y-0 hover:-translate-y-0.5"
        >
          + New Order
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-3 text-red-700 dark:text-red-300">
          <FiAlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Orders List */}
      <div className="grid gap-6">
        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.order_id;
          const statusConfig = getStatusConfig(order.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={order.id || order.order_id}
              className={`group bg-white dark:bg-gray-800 rounded-2xl p-6 transition-all duration-300 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 ${isExpanded ? 'shadow-xl shadow-gray-100 dark:shadow-none ring-1 ring-gray-100 dark:ring-gray-700' : 'shadow-sm hover:shadow-md'
                }`}
            >
              <div
                className="flex flex-col md:flex-row gap-6 cursor-pointer"
                onClick={() => handleToggleDetails(order.order_id)}
              >
                {/* Order Main Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium text-gray-400">#{order.order_id.slice(0, 8)}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${statusConfig.color}`}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {order.services?.map(s => s.service_type).join(", ") || "Laundry Service"}
                      </h3>
                    </div>
                    <div className="text-right md:hidden">
                      <span className="block text-xl font-bold text-gray-900 dark:text-gray-100">₨ {order.total_amount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <FiCalendar size={14} className="text-gray-400" />
                      {formatDate(order.created)}
                    </div>
                    {order.branch_name && (
                      <div className="flex items-center gap-2">
                        <FiMapPin size={14} className="text-gray-400" />
                        {order.branch_name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side Actions/Price */}
                <div className="hidden md:flex flex-col items-end justify-between min-w-[120px]">
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-100">₨ {order.total_amount}</span>
                  <button className={`text-gray-400 group-hover:text-blue-600 transition-colors flex items-center gap-1 text-sm font-medium ${isExpanded ? 'text-blue-600' : ''}`}>
                    {isExpanded ? 'Hide Details' : 'View Details'}
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-gray-50 dark:border-gray-700/50' : 'grid-rows-[0fr] opacity-0 h-0 overflow-hidden'}`}>
                <div className="overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-8">

                    {/* Item List */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">Items</h4>
                      <div className="space-y-3">
                        {(order.services || []).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                            <div>
                              <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">{item.service_type}</span>
                              <div className="text-gray-500 text-xs mt-0.5">{item.material} • {item.quantity} {item.pricing_type === 'bulk' ? 'kg' : 'pcs'}</div>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">₨ {item.total_price}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex justify-between items-center text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
                        <span className="text-gray-500">Payment Status</span>
                        <span className={`font-semibold capitalize px-2 py-0.5 rounded ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {order.payment_status?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Logistics */}
                    <div className="space-y-6">
                      {(order.pickup_enabled || order.delivery_enabled) && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">Logistics</h4>
                          <div className="space-y-4">
                            {order.pickup_enabled && (
                              <div className="flex gap-3">
                                <div className="mt-1"><FiTruck className="text-blue-500" /></div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">Pickup</div>
                                  <div className="text-gray-500 text-sm">{formatDate(order.pickup_date)} {order.pickup_time && `• ${order.pickup_time}`}</div>
                                  <div className="text-gray-400 text-xs mt-0.5">{order.pickup_address}</div>
                                </div>
                              </div>
                            )}
                            {order.delivery_enabled && (
                              <div className="flex gap-3">
                                <div className="mt-1"><FiPackage className="text-purple-500" /></div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">Delivery</div>
                                  <div className="text-gray-500 text-sm">{formatDate(order.delivery_date)} {order.delivery_time && `• ${order.delivery_time}`}</div>
                                  <div className="text-gray-400 text-xs mt-0.5">{order.delivery_address}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {order.is_urgent && (
                        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-lg p-3 flex items-center gap-3">
                          <div className="p-1.5 bg-orange-100 dark:bg-orange-800 rounded-full text-orange-600 dark:text-orange-200">
                            <FiClock size={14} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-orange-800 dark:text-orange-200">Urgent Service</div>
                            <div className="text-xs text-orange-600 dark:text-orange-300">Priority processing requested</div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {orders.length === 0 && !loading && (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <FiPackage className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            No orders yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">
            It looks like you haven&apos;t placed any orders yet. Start your first laundry request now!
          </p>
          <Link
            href="/customer/place-order"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold shadow-lg shadow-blue-200 dark:shadow-none transition-all hover:scale-105"
          >
            Place First Order
          </Link>
        </div>
      )}
    </div>
  );
}
