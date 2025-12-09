// OrderManagement.tsx
"use client";

import "../../types/i18n";
import React, { JSX, useMemo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FaSearch,
  FaPlus,
  FaEye,
  FaEdit,
  FaTruck,
  FaBoxOpen,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
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
import PaymentService from "../../services/paymentService";
import { orderAPI, Order as BackendOrder, OrderItem as OrderItemType } from "../../services/orderService";
import { useAuth } from "../../contexts/AuthContext";

type OrderStatus = "pending" | "processing" | "ready" | "delivered" | "cancelled";

// Frontend display interface (mapped from backend)
interface DisplayOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  service: string;
  items: string[];
  status: OrderStatus;
  amount: number;
  receivedDate: string;
  deliveryDate?: string;
  branchId: string;
  branchName: string;
  notes?: string;
  paymentMethod: string;
  paymentStatus: string;
}

const STATUS_META: Record<
  OrderStatus,
  { color: string; labelKey: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }
> = {
  pending: { color: "bg-blue-100 text-blue-800", labelKey: "orders.status.pending", Icon: FaBoxOpen },
  processing: { color: "bg-yellow-100 text-yellow-800", labelKey: "orders.status.processing", Icon: FaClock },
  ready: { color: "bg-green-100 text-green-800", labelKey: "orders.status.ready", Icon: FaCheckCircle },
  delivered: { color: "bg-gray-100 text-gray-800", labelKey: "orders.status.delivered", Icon: FaTruck },
  cancelled: { color: "bg-red-100 text-red-800", labelKey: "orders.status.cancelled", Icon: FaExclamationTriangle },
};

const PAYMENT_STATUS_META: Record<
  'pending' | 'partially_paid' | 'paid' | 'unpaid' | 'failed',
  { color: string; labelKey: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }
> = {
  pending: { color: "bg-yellow-100 text-yellow-800", labelKey: "orders.paymentStatus.pending", Icon: FaClock },
  partially_paid: { color: "bg-blue-100 text-blue-800", labelKey: "orders.paymentStatus.partiallyPaid", Icon: FaSpinner },
  paid: { color: "bg-green-100 text-green-800", labelKey: "orders.paymentStatus.paid", Icon: FaCheckCircle },
  unpaid: { color: "bg-red-100 text-red-800", labelKey: "orders.paymentStatus.unpaid", Icon: FaExclamationTriangle },
  failed: { color: "bg-red-100 text-red-800", labelKey: "orders.paymentStatus.failed", Icon: FaExclamationTriangle },
};

export default function OrderManagement(): JSX.Element {
  const { t } = useTranslation();
  useAuth();

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    service: "Wash & Fold",
    items: "",
    amount: "",
    branchId: "1",
    branchName: "Main Branch",
    notes: "",
    paymentMethod: "cash", // Add payment method to form
  });

  // Orders state - using backend data
  const [orders, setOrders] = useState<DisplayOrder[]>([]);

  // Function to map backend order to display format
  const mapBackendOrderToDisplay = (backendOrder: BackendOrder): DisplayOrder => {
    const services = backendOrder.services || [];
    const items = services.map((service: { service_type: string; quantity: number }) =>
      `${service.service_type} (${service.quantity})`
    );

    // Safe date parsing with fallback
    let receivedDate = new Date().toISOString().split("T")[0]; // Default to today
    try {
      if (backendOrder.created) {
        const parsedDate = new Date(backendOrder.created);
        if (!isNaN(parsedDate.getTime())) {
          receivedDate = parsedDate.toISOString().split("T")[0];
        }
      }
    } catch (error) {
      console.warn('Error parsing created date:', backendOrder.created, error);
    }

    return {
      id: backendOrder.order_id.toString(),
      customerName: "Customer", // User ID is available but name is not in Order interface
      customerPhone: "N/A", // Not available in current backend model
      service: services.length > 0 ? services[0].service_type : "Mixed Services",
      items,
      status: backendOrder.status as OrderStatus,
      amount: Number(backendOrder.total_amount),
      receivedDate,
      deliveryDate: backendOrder.delivery_date || undefined,
      branchId: backendOrder.branch.toString(),
      branchName: backendOrder.branch_name || "Main Branch",
      notes: undefined, // Description not available in Order interface
      paymentMethod: backendOrder.payment_method,
      paymentStatus: backendOrder.payment_status,
    };
  };

  // Fetch orders from backend
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const backendOrders = await orderAPI.list({
        ordering: "-created", // Get newest orders first
      });
      const displayOrders = backendOrders.map(mapBackendOrderToDisplay);
      setOrders(displayOrders);
    } catch (err: unknown) {
      console.error("Error fetching orders:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch orders";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);


  // };

  // Load orders on component mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Derived data
  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (paymentStatusFilter !== "all" && o.paymentStatus !== paymentStatusFilter) return false;
      if (!q) return true;
      return (
        o.customerName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.branchName.toLowerCase().includes(q)
      );
    });
  }, [orders, searchTerm, statusFilter, paymentStatusFilter]);

  const statusCounts = useMemo(() => {
    const map: Record<OrderStatus, number> = {
      pending: 0,
      processing: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
    };
    orders.forEach((o) => {
      if (o.status in map) {
        map[o.status as OrderStatus] = (map[o.status as OrderStatus] || 0) + 1;
      }
    });
    return map;
  }, [orders]);

  // For charts: revenue by branch
  const revenueByBranch = useMemo(() => {
    const map = new Map<string, { branchName: string; revenue: number; orders: number }>();
    orders.forEach((o) => {
      const k = o.branchId;
      if (!map.has(k)) map.set(k, { branchName: o.branchName, revenue: 0, orders: 0 });
      const cur = map.get(k)!;
      cur.revenue += o.amount;
      cur.orders += 1;
    });
    return Array.from(map.entries()).map(([branchId, v]) => ({ branchId, name: v.branchName, revenue: v.revenue, orders: v.orders }));
  }, [orders]);

  // UI helpers
  const openAdd = () => setIsAddOpen(true);
  const closeAdd = () => {
    setIsAddOpen(false);
    setForm({
      customerName: "",
      customerPhone: "",
      service: "Wash & Fold",
      items: "",
      amount: "",
      branchId: "1",
      branchName: "Main Branch",
      notes: "",
      paymentMethod: "cash"
    });
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!form.customerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    const orderAmount = Number(form.amount) || 0;
    if (orderAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Prepare order data for backend API (match frontend CreateOrderRequest)
      const servicesPayload: OrderItemType[] = [
        {
          service_type: form.service,
          material: "unknown",
          quantity: 1,
          pricing_type: 'individual',
          price_per_unit: orderAmount,
          total_price: orderAmount,
        },
      ];

      const orderData = {
        branch: Number(form.branchId || 1),
        services: servicesPayload,
        pickup_enabled: false,
        delivery_enabled: false,
        is_urgent: false,
        total_amount: orderAmount,
        payment_method: form.paymentMethod as 'cash' | 'bank' | 'esewa',
        payment_status: 'pending' as const,
        status: 'pending' as const,
        description: form.notes || ''
      };

      // Create order using backend API
      const createdOrder = await orderAPI.create(orderData);
      console.log('Order created successfully:', createdOrder);

      // Handle payment based on method
      if (form.paymentMethod === 'esewa') {
        // Initiate eSewa payment
        const paymentResponse = await PaymentService.initiatePayment({
          payment_type: 'esewa',
          amount: orderAmount,
          order_id: createdOrder.order_id.toString(),
        });

        if (paymentResponse.success && paymentResponse.payment_data && paymentResponse.esewa_url) {
          // Show success message and redirect to eSewa
          alert(`Order ${createdOrder.order_id} created successfully! Redirecting to eSewa for payment of Rs. ${orderAmount}...`);

          // Submit to eSewa
          PaymentService.submitEsewaPayment(paymentResponse.payment_data, paymentResponse.esewa_url);

          closeAdd();
          fetchOrders(); // Refresh orders list
        } else {
          alert(`Failed to initiate eSewa payment: ${paymentResponse.error || 'Unknown error'}`);
        }
      } else if (form.paymentMethod === 'bank') {
        // Initiate bank payment
        const paymentResponse = await PaymentService.initiatePayment({
          payment_type: 'bank',
          amount: orderAmount,
          order_id: createdOrder.order_id.toString(),
        });

        if (paymentResponse.success && paymentResponse.bank_details) {
          // Show bank details
          const bankDetails = paymentResponse.bank_details;
          alert(`Order ${createdOrder.order_id} created successfully!\n\nBank Transfer Details:\nAccount Name: ${bankDetails.account_name}\nAccount Number: ${bankDetails.account_number}\nBank: ${bankDetails.bank_name}\nSWIFT: ${bankDetails.swift_code}\n\nPlease transfer Rs. ${orderAmount} and keep the receipt.`);

          closeAdd();
          fetchOrders(); // Refresh orders list
        } else {
          alert(`Failed to create bank payment: ${paymentResponse.error || 'Unknown error'}`);
        }
      } else {
        // Cash on delivery - create payment record
        const paymentResponse = await PaymentService.initiatePayment({
          payment_type: 'cash',
          amount: orderAmount,
          order_id: createdOrder.order_id.toString(),
        });

        if (paymentResponse.success) {
          alert(`Order ${createdOrder.order_id} created successfully! Payment will be collected on delivery (Rs. ${orderAmount}).`);
          closeAdd();
          fetchOrders(); // Refresh orders list
        } else {
          alert(`Failed to create order: ${paymentResponse.error || 'Unknown error'}`);
        }
      }
    } catch (error: unknown) {
      console.error('Order creation error:', error);

      // Show more specific error message
      let errorMessage = 'Failed to create order. Please try again.';
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error as { response?: { data?: unknown } };
        if (errorResponse.response?.data) {
          if (typeof errorResponse.response.data === 'string') {
            errorMessage = errorResponse.response.data;
          } else if (errorResponse.response.data && typeof errorResponse.response.data === 'object' && 'detail' in errorResponse.response.data) {
            errorMessage = String((errorResponse.response.data as { detail?: string }).detail || errorMessage);
          } else if (errorResponse.response.data && typeof errorResponse.response.data === 'object' && 'error' in errorResponse.response.data) {
            errorMessage = String((errorResponse.response.data as { error?: string }).error || errorMessage);
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(`Error: ${errorMessage}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleChangeStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // Find the order to get its backend ID
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // Update status in backend
      await orderAPI.update(orderId, { status: newStatus });

      // Update local state
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

      // Refresh orders to get latest data
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const handleChangePaymentStatus = async (orderId: string, newPaymentStatus: 'pending' | 'partially_paid' | 'paid' | 'unpaid' | 'failed') => {
    try {
      // Find the order to get its backend ID
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // Update payment status in backend
      await orderAPI.update(orderId, { payment_status: newPaymentStatus });

      // Update local state
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o)));

      // Refresh orders to get latest data
      fetchOrders();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status. Please try again.');
    }
  };

  // Small status badge
  const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
    const meta = STATUS_META[status];
    const Icon = meta.Icon;
    return (
      <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full ${meta.color}`}>
        <Icon className="w-3 h-3" />
        <span>{t(meta.labelKey)}</span>
      </span>
    );
  };

  // Payment status badge
  const PaymentStatusBadge: React.FC<{ status: 'pending' | 'partially_paid' | 'paid' | 'unpaid' | 'failed' }> = ({ status }) => {
    const meta = PAYMENT_STATUS_META[status];
    const Icon = meta.Icon;
    return (
      <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full ${meta.color}`}>
        <Icon className="w-3 h-3" />
        <span>{t(meta.labelKey)}</span>
      </span>
    );
  };

  const pieData = useMemo(
    () =>
      (Object.keys(statusCounts) as OrderStatus[]).map((k) => ({
        name: t(STATUS_META[k].labelKey),
        value: statusCounts[k],
        key: k,
      })),
    [statusCounts, t]
  );

  const COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#6B7280"];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t("orders.title", "Orders")}</h1>
          <p className="text-sm text-gray-600">{t("orders.subtitle", "Manage laundry orders, status and revenue")}</p>
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600 text-sm mt-1">
              <FaSpinner className="animate-spin" />
              <span>Loading orders...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
              <FaExclamationTriangle />
              <span>{error}</span>
              <button
                onClick={fetchOrders}
                className="underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              aria-label={t("common.search", "Search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("common.searchPlaceholder", "Search orders, customers, branches...")}
              className="w-full sm:w-80 pl-10 pr-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white"
            aria-label={t("orders.filterByStatus", "Filter by status")}
          >
            <option value="all">{t("orders.filter.all", "All Status")}</option>
            <option value="pending">{t("orders.status.pending")}</option>
            <option value="processing">{t("orders.status.processing")}</option>
            <option value="ready">{t("orders.status.ready")}</option>
            <option value="delivered">{t("orders.status.delivered")}</option>
            <option value="cancelled">{t("orders.status.cancelled")}</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white"
            aria-label={t("orders.filterByPaymentStatus", "Filter by payment status")}
          >
            <option value="all">{t("orders.filter.allPayment", "All Payment Status")}</option>
            <option value="pending">{t("orders.paymentStatus.pending", "Pending")}</option>
            <option value="partially_paid">{t("orders.paymentStatus.partiallyPaid", "Partially Paid")}</option>
            <option value="paid">{t("orders.paymentStatus.paid", "Paid")}</option>
            <option value="unpaid">{t("orders.paymentStatus.unpaid", "Unpaid")}</option>
            <option value="failed">{t("orders.paymentStatus.failed", "Failed")}</option>
          </select>

          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            aria-label={t("orders.addNew", "Add New Order")}
          >
            <FaPlus />
            <span className="hidden sm:inline">{t("orders.addNew", "Add New")}</span>
          </button>
        </div>
      </div>

      {/* Top charts & summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="text-lg font-semibold mb-3">{t("orders.revenueByBranch", "Revenue by Branch")}</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByBranch}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" name={t("orders.chart.revenue", "Revenue (₨)")} fill="#8884d8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="orders" name={t("orders.chart.orders", "Orders")} fill="#82ca9d" radius={[6, 6, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="text-lg font-semibold mb-3">{t("orders.statusDistribution", "Status Distribution")}</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={70} innerRadius={30} label>
                  {pieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="p-4 border rounded-lg shadow-sm bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">{t("orders.allOrders", "Orders")} ({filteredOrders.length})</h3>
          <div className="text-sm text-gray-500">{t("orders.updated", "Live data")}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-auto border-collapse">
            <thead className="text-left text-xs text-gray-600 uppercase">
              <tr>
                <th className="px-3 py-2">#{t("orders.id", "ID")}</th>
                <th className="px-3 py-2">{t("orders.customer", "Customer")}</th>
                <th className="px-3 py-2">{t("orders.service", "Service")}</th>
                <th className="px-3 py-2">{t("orders.statusLabel", "Status")}</th>
                <th className="px-3 py-2">{t("orders.paymentStatus", "Payment Status")}</th>
                <th className="px-3 py-2">{t("orders.amount", "Amount")}</th>
                <th className="px-3 py-2">{t("orders.branch", "Branch")}</th>
                <th className="px-3 py-2">{t("orders.date", "Date")}</th>
                <th className="px-3 py-2">{t("common.actions", "Actions")}</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 align-top font-medium whitespace-nowrap">{order.id}</td>
                  <td className="px-3 py-3 align-top">
                    <div className="text-sm font-medium">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerPhone}</div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="text-sm">{order.service}</div>
                    <div className="text-xs text-gray-500">{order.items.join(", ")}</div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-col gap-2">
                      <StatusBadge status={order.status} />
                      <select
                        value={order.status}
                        onChange={(e) => handleChangeStatus(order.id, e.target.value as OrderStatus)}
                        aria-label={t("orders.changeStatus", "Change status")}
                        className="px-2 py-1 border rounded-md text-xs"
                      >
                        <option value="pending">{t("orders.status.pending")}</option>
                        <option value="processing">{t("orders.status.processing")}</option>
                        <option value="ready">{t("orders.status.ready")}</option>
                        <option value="delivered">{t("orders.status.delivered")}</option>
                        <option value="cancelled">{t("orders.status.cancelled")}</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-col gap-2">
                      <PaymentStatusBadge status={order.paymentStatus as 'pending' | 'partially_paid' | 'paid' | 'unpaid' | 'failed'} />
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => handleChangePaymentStatus(order.id, e.target.value as 'pending' | 'partially_paid' | 'paid' | 'unpaid' | 'failed')}
                        aria-label={t("orders.changePaymentStatus", "Change payment status")}
                        className="px-2 py-1 border rounded-md text-xs"
                      >
                        <option value="pending">{t("orders.paymentStatus.pending", "Pending")}</option>
                        <option value="partially_paid">{t("orders.paymentStatus.partiallyPaid", "Partially Paid")}</option>
                        <option value="paid">{t("orders.paymentStatus.paid", "Paid")}</option>
                        <option value="unpaid">{t("orders.paymentStatus.unpaid", "Unpaid")}</option>
                        <option value="failed">{t("orders.paymentStatus.failed", "Failed")}</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">₨ {order.amount.toLocaleString()}</td>
                  <td className="px-3 py-3 align-top">{order.branchName}</td>
                  <td className="px-3 py-3 align-top">
                    <div className="text-sm">{order.receivedDate}</div>
                    {order.deliveryDate && <div className="text-xs text-gray-500">Delivered: {order.deliveryDate}</div>}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <button
                        title={t("orders.view", "View")}
                        className="p-2 rounded-md hover:bg-gray-100"
                        onClick={() => alert(JSON.stringify(order, null, 2))}
                      >
                        <FaEye />
                      </button>
                      <button
                        title={t("orders.edit", "Edit")}
                        className="p-2 rounded-md hover:bg-gray-100"
                        onClick={() => alert("Edit flow - implement your own")}
                      >
                        <FaEdit />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-gray-500">
                    {t("orders.empty", "No orders found")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(["pending", "processing", "ready", "delivered", "cancelled"] as OrderStatus[]).map((k, idx) => (
          <div key={k} className="p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{t(STATUS_META[k].labelKey)}</div>
              <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
            </div>
            <div className="mt-2 text-2xl font-semibold">{statusCounts[k] ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Add Order Modal (simple) */}
      {isAddOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/40" onClick={closeAdd} />
          <form
            onSubmit={handleCreateOrder}
            className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">{t("orders.addNew", "Add New Order")}</h4>
              <button type="button" onClick={closeAdd} aria-label={t("common.close", "Close")} className="text-gray-600">✕</button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm">
                <div className="text-xs text-gray-600">{t("orders.customerName", "Customer Name")}</div>
                <input
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  required
                />
              </label>

              <label className="block text-sm">
                <div className="text-xs text-gray-600">{t("orders.customerPhone", "Phone")}</div>
                <input
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                />
              </label>

              <label className="block text-sm">
                <div className="text-xs text-gray-600">{t("orders.service", "Service")}</div>
                <select
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                >
                  <option>Wash & Fold</option>
                  <option>Dry Cleaning</option>
                  <option>Iron Only</option>
                  <option>Express Wash</option>
                </select>
              </label>

              <label className="block text-sm">
                <div className="text-xs text-gray-600">{t("orders.items", "Items (comma separated)")}</div>
                <input
                  value={form.items}
                  onChange={(e) => setForm({ ...form, items: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                />
              </label>

              <div className="flex gap-2">
                <label className="flex-1 text-sm">
                  <div className="text-xs text-gray-600">{t("orders.amount", "Amount (₨)")}</div>
                  <input
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    type="number"
                    min="1"
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    required
                  />
                </label>

                <label className="flex-1 text-sm">
                  <div className="text-xs text-gray-600">{t("orders.branch", "Branch")}</div>
                  <select
                    value={form.branchId}
                    onChange={(e) =>
                      setForm({ ...form, branchId: e.target.value, branchName: e.target.selectedOptions[0].text })
                    }
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  >
                    <option value="1">Main Branch</option>
                    <option value="2">Downtown Branch</option>
                    <option value="3">Mall Branch</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm">
                <div className="text-xs text-gray-600">{t("orders.notes", "Notes (optional)")}</div>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                />
              </label>

              <label className="block text-sm">
                <div className="text-xs text-gray-600">Payment Method</div>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                >
                  <option value="cash">💵 Cash on Delivery</option>
                  <option value="bank">🏦 Bank Transfer</option>
                  <option value="esewa">📱 eSewa (Online Payment)</option>
                </select>
              </label>

              {form.paymentMethod !== 'cash' && (
                <div className={`p-3 rounded-md ${form.paymentMethod === 'esewa' ? 'bg-green-50' : 'bg-blue-50'
                  }`}>
                  <p className={`text-sm ${form.paymentMethod === 'esewa' ? 'text-green-800' : 'text-blue-800'
                    }`}>
                    {form.paymentMethod === 'esewa'
                      ? '🚀 You will be redirected to eSewa for secure online payment after creating the order.'
                      : '🏛️ Bank transfer details will be provided after creating the order. Please transfer the amount and keep the receipt.'
                    }
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeAdd}
                  className="px-4 py-2 border rounded-md"
                  disabled={isProcessingPayment}
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 disabled:opacity-50"
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment && <FaSpinner className="animate-spin" />}
                  {isProcessingPayment
                    ? (form.paymentMethod === 'esewa' ? 'Processing Payment...' : 'Creating Order...')
                    : t("orders.create", "Create Order")
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
