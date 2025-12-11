
"use client";

// This is the page that only tracks the orders of the current customer filtered by customer id

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { FiPackage, FiClock, FiCheck, FiTruck } from "react-icons/fi";
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
        setLoading(true);
        const fetchedOrders = await orderAPI.list({ ordering: '-created' });
        setOrders(fetchedOrders);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleToggleDetails = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <FiPackage className="mx-auto h-8 w-8 animate-pulse mb-2" />
        {t('common.loading')}
      </div>
    );
  }

  // Prevent hydration mismatch by not rendering until user is loaded on client
  if (typeof window !== 'undefined' && !user) {
    return <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending pickup":
      case "to be delivered":
      case "out_for_delivery":
      case "delivered": // Keep for backward compatibility if needed, or remove
        return <FiTruck className="text-purple-500" />;
      case "pending":
        return <FiClock className="text-yellow-500" />;
      case "in progress":
      case "processing": // Keep for backward compatibility
        return <FiPackage className="text-blue-500" />;
      case "ready":
        return <FiCheck className="text-green-500" />;
      case "completed":
        return <FiCheck className="text-green-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending pickup":
        return t('customer.orders.status.pendingPickup', 'Pending Pickup');
      case "pending":
        return t('customer.orders.status.pending');
      case "in progress":
      case "processing":
        return t('customer.orders.status.processing');
      case "ready":
        return t('customer.orders.status.ready');
      case "to be delivered":
      case "delivered":
      case "out_for_delivery":
        return t('customer.orders.status.outForDelivery');
      case "completed":
        return t('customer.orders.status.completed');
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('customer.orders.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {user ? (
            <>{t('customer.orders.welcomeBack')}, {user.first_name}! {t('customer.orders.trackOrders')}</>
          ) : (
            <>{t('customer.orders.trackOrders')}</>
          )}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.order_id;
          return (
            <div
              key={order.id || order.order_id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {order.order_id}
                    </h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="text-sm font-medium capitalize">
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">{t('customer.orders.orderDate')}:</span> {formatDate(order.created)}
                    </div>
                    {order.pickup_enabled && order.pickup_date && (
                      <div>
                        <span className="font-medium">{t('customer.orders.pickup')}:</span> {formatDate(order.pickup_date)}
                      </div>
                    )}
                    {order.delivery_enabled && order.delivery_date && (
                      <div>
                        <span className="font-medium">{t('customer.orders.delivery')}:</span> {formatDate(order.delivery_date)}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{t('customer.orders.branch')}:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{order.branch_name}</span>
                      </div>
                      {order.delivery_enabled && order.delivery_time && (
                        <div className="mb-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{t('customer.orders.deliveryTime')}:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">{order.delivery_time}</span>
                        </div>
                      )}
                      {order.pickup_address && (
                        <div className="mb-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Pickup Address:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">{order.pickup_address}</span>
                        </div>
                      )}
                      {order.delivery_address && (
                        <div className="mb-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Delivery Address:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">{order.delivery_address}</span>
                        </div>
                      )}
                      <div className="mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{t('customer.orders.items')}:</span>
                        <table className="min-w-full mt-2 text-sm">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="pr-4">{t('customer.orders.item')}</th>
                              <th className="pr-4">{t('customer.orders.qty')}</th>
                              <th className="pr-4">{t('customer.orders.unitPrice')}</th>
                              <th className="pr-4">{t('customer.orders.total')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(order.services || []).map((item, idx) => (
                              <tr key={idx}>
                                <td className="pr-4 capitalize">{item.service_type} ({item.material})</td>
                                <td className="pr-4">{item.quantity}</td>
                                <td className="pr-4">₨ {item.price_per_unit}</td>
                                <td className="pr-4">₨ {item.total_price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between text-sm">
                          <span>Payment Method:</span>
                          <span className="capitalize">{order.payment_method}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Payment Status:</span>
                          <span className={`capitalize ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {order.payment_status}
                          </span>
                        </div>
                        {order.is_urgent && (
                          <div className="mt-2 text-orange-600 font-medium">
                            ⚡ Urgent Service
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Total */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ₨ {order.total_amount}
                  </div>
                  <button
                    className="mt-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    onClick={() => handleToggleDetails(order.order_id)}
                  >
                    {isExpanded ? t('customer.orders.hideDetails') : t('customer.orders.viewDetails')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {orders.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <FiPackage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('customer.orders.noOrdersYet')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('customer.orders.noOrdersMessage')}
          </p>
          <Link
            href="/customer/place-order"
            className="mt-4 inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t('customer.orders.placeNewOrder')}
          </Link>
        </div>
      )}
    </div>
  );
}
