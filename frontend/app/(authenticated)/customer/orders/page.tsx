
"use client";

// This is the page that only tracks the orders of the curent customer filtered by customer id

import React from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { FiPackage, FiClock, FiCheck, FiTruck } from "react-icons/fi";


export default function CustomerOrdersPage() {
  const { user } = useAuth();

  // Mock orders data - replace with actual API call
  const orders = [
    {
      id: "ORD-001",
      date: "2024-12-20",
      status: "processing",
      items: [
        { name: "Shirts", quantity: 3, price: 50 },
        { name: "Pants", quantity: 2, price: 100 },
      ],
      total: 450,
      pickupDate: "2024-12-21",
      deliveryDate: "2024-12-23",
      branch: "Kathmandu Main Branch",
      deliveryTime: "2:00 PM - 4:00 PM",
      notes: "Please handle with care."
    },
    {
      id: "ORD-002",
      date: "2024-12-18",
      status: "completed",
      items: [
        { name: "Dress", quantity: 1, price: 300 },
        { name: "Jacket", quantity: 1, price: 350 },
      ],
      total: 650,
      pickupDate: "2024-12-19",
      deliveryDate: "2024-12-21",
      branch: "Lalitpur Branch",
      deliveryTime: "11:00 AM - 1:00 PM",
      notes: "Delivered to security guard."
    }
  ];

  // State to track which order is expanded
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(null);

  const handleToggleDetails = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  // Prevent hydration mismatch by not rendering until user is loaded on client
  if (typeof window !== 'undefined' && !user) {
    // You can show a loading spinner or nothing
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <FiClock className="text-yellow-500" />;
      case "processing":
        return <FiPackage className="text-blue-500" />;
      case "ready":
        return <FiCheck className="text-green-500" />;
      case "out_for_delivery":
        return <FiTruck className="text-purple-500" />;
      case "completed":
        return <FiCheck className="text-green-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending Pickup";
      case "processing":
        return "In Process";
      case "ready":
        return "Ready for Delivery";
      case "out_for_delivery":
        return "Out for Delivery";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          My Orders
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {user ? (
            <>Welcome back, {user.first_name}! Track your laundry orders here.</>
          ) : (
            <>Track your laundry orders here.</>
          )}
        </p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          return (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {order.id}
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
                      <span className="font-medium">Order Date:</span> {order.date}
                    </div>
                    <div>
                      <span className="font-medium">Pickup:</span> {order.pickupDate}
                    </div>
                    <div>
                      <span className="font-medium">Delivery:</span> {order.deliveryDate}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Branch:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{order.branch}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Delivery Time:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{order.deliveryTime}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Order Notes:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{order.notes}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Items:</span>
                        <table className="min-w-full mt-2 text-sm">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="pr-4">Item</th>
                              <th className="pr-4">Qty</th>
                              <th className="pr-4">Unit Price</th>
                              <th className="pr-4">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="pr-4">{item.name}</td>
                                <td className="pr-4">{item.quantity}</td>
                                <td className="pr-4">₨ {item.price}</td>
                                <td className="pr-4">₨ {item.price * item.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Total */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ₨ {order.total}
                  </div>
                  <button
                    className="mt-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    onClick={() => handleToggleDetails(order.id)}
                  >
                    {isExpanded ? "Hide Details" : "View Details"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <FiPackage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No orders yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            When you place your first order, it will appear here.
          </p>
          <button className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Place New Order
          </button>
        </div>
      )}
    </div>
  );
}
