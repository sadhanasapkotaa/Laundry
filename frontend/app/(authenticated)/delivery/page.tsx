"use client";

import "../../types/i18n";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiMapPin, FiPackage, FiPhone, FiRefreshCw, FiTruck, FiCalendar } from "react-icons/fi";
import { deliveryAPI, Delivery } from "../../services/deliveryService";
import { useAuth } from "../../contexts/AuthContext";
import dynamic from "next/dynamic";

// Dynamically import DeliveryMap to avoid SSR issues
const DeliveryMap = dynamic(() => import("./DeliveryMap"), { ssr: false });

// Simple Card component
const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className}`}>{children}</div>
);

// Simple Badge component
const Badge: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${className}`}>{children}</span>
);

const TIME_SLOT_LABELS: Record<string, string> = {
    'early_morning': 'Early Morning (6am - 9am)',
    'late_morning': 'Late Morning (9am - 12pm)',
    'early_afternoon': 'Early Afternoon (12pm - 3pm)',
    'late_afternoon': 'Late Afternoon (3pm - 6pm)',
};

export default function DeliveryDashboard() {
    const { t } = useTranslation();
    const { user: _ } = useAuth();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDeliveries = async () => {
        try {
            setRefreshing(true);
            setError(null);
            const data = await deliveryAPI.list();
            setDeliveries(data);
        } catch (err) {
            console.error("Failed to fetch deliveries:", err);
            setError("Failed to load deliveries");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const handleStatusUpdate = async (id: number, newStatus: 'in_progress' | 'delivered') => {
        try {
            await deliveryAPI.update(id, { status: newStatus });
            fetchDeliveries(); // Refresh list
        } catch (err) {
            console.error("Failed to update status:", err);
            alert("Failed to update status");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400";
            case "in_progress": return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400";
            case "delivered": return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400";
            case "cancelled": return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400";
            default: return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };



    // Helper to format date
    const isToday = (dateString: string) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Group deliveries
    // Source of truth for date: `delivery_start_time` (combined date+slot/time) or fallback to `delivery_date` (Order creation?) 
    // Wait, `delivery_date` on Delivery model is creation. `delivery_start_time` is the scheduled one.
    // Ideally we use `delivery_start_time`.
    const getScheduledDate = (d: Delivery) => d.delivery_start_time || d.delivery_date;

    const todayDeliveries = deliveries.filter(d => isToday(getScheduledDate(d)) && d.status !== 'cancelled');
    const otherDeliveries = deliveries.filter(d => !isToday(getScheduledDate(d)) && d.status !== 'cancelled' && d.status !== 'delivered'); // Pending future/past?
    // Maybe show all history too? User said "pickups and deliveries done before or after that day should have different sections."
    // Let's split "Active/Pending Future" vs "History"?
    // Or just "Today" vs "Everything else" as requested.
    // I'll group "Others" by date.

    // Further split Today by Type
    const todayPickups = todayDeliveries.filter(d => d.delivery_type === 'pickup');
    const todayDrops = todayDeliveries.filter(d => d.delivery_type === 'drop');

    // Sort today's tasks by time (morning -> evening)
    const timeOrder = { 'early_morning': 1, 'late_morning': 2, 'early_afternoon': 3, 'late_afternoon': 4 };
    const sortTasks = (tasks: Delivery[]) => {
        return [...tasks].sort((a, b) => {
            const tA = timeOrder[a.delivery_time as keyof typeof timeOrder] || 99;
            const tB = timeOrder[b.delivery_time as keyof typeof timeOrder] || 99;
            return tA - tB;
        });
    };

    const sortedTodayPickups = sortTasks(todayPickups);
    const sortedTodayDrops = sortTasks(todayDrops);

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading deliveries...</div>;
    }

    return (
        <div className="space-y-6 p-4 md:p-6 pt-16 md:pt-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("delivery.title") || "Delivery Dashboard"}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <button
                    onClick={fetchDeliveries}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                    <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Refreshing..." : (t("common.refresh") || "Refresh")}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* TODAY'S OVERVIEW + MAP */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Section */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FiMapPin /> Today&apos;s Route
                    </h2>
                    <div className="h-[400px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner">
                        {todayDeliveries.length > 0 ? (
                            <DeliveryMap deliveries={[...sortedTodayPickups, ...sortedTodayDrops]} height="400px" />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                No tasks for today.
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats / Quick Summary */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Summary</h2>
                    <div className="grid grid-cols-1 gap-4">
                        <Card className="p-4 border-l-4 border-blue-500 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pickups Today</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{todayPickups.length}</p>
                            </div>
                            <FiPackage className="text-blue-500 text-2xl" />
                        </Card>
                        <Card className="p-4 border-l-4 border-green-500 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Deliveries Today</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{todayDrops.length}</p>
                            </div>
                            <FiTruck className="text-green-500 text-2xl" />
                        </Card>
                    </div>
                </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* TODAY'S TASKS LISTS */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Today&apos;s Tasks</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* PICKUPS COLUMN */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                        <FiPackage /> Pickups ({sortedTodayPickups.length})
                    </h3>
                    {sortedTodayPickups.length === 0 && <p className="text-gray-500 text-sm pl-2">No pickups scheduled.</p>}
                    {sortedTodayPickups.map((delivery) => (
                        <TaskCard key={delivery.id} delivery={delivery} onStatusUpdate={handleStatusUpdate} type="pickup" />
                    ))}
                </div>

                {/* DELIVERIES COLUMN */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2 bg-green-50 p-3 rounded-lg border border-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
                        <FiTruck /> Deliveries ({sortedTodayDrops.length})
                    </h3>
                    {sortedTodayDrops.length === 0 && <p className="text-gray-500 text-sm pl-2">No deliveries scheduled.</p>}
                    {sortedTodayDrops.map((delivery) => (
                        <TaskCard key={delivery.id} delivery={delivery} onStatusUpdate={handleStatusUpdate} type="drop" />
                    ))}
                </div>
            </div>

            {/* OTHER TASKS (Upcoming/History) */}
            {otherDeliveries.length > 0 && (
                <>
                    <hr className="border-gray-200 dark:border-gray-700 my-8" />
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <FiCalendar /> Other Tasks
                        </h2>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {otherDeliveries.map((delivery) => (
                                            <tr key={delivery.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {new Date(getScheduledDate(delivery)).toLocaleDateString()} <br />
                                                    <span className="text-xs text-gray-500">{TIME_SLOT_LABELS[delivery.delivery_time] || delivery.delivery_time}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                    <span className={`px-2 py-0.5 rounded text-xs ${delivery.delivery_type === 'pickup' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                        {delivery.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {delivery.customer_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{delivery.delivery_address}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge className={getStatusColor(delivery.status)}>
                                                        {delivery.status.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}

// Sub-component for individual Task Cards
const TaskCard = ({ delivery, onStatusUpdate, type }: { delivery: Delivery, onStatusUpdate: (id: number, status: 'in_progress' | 'delivered') => void, type: 'pickup' | 'drop' }) => {

    // Branch info display logic
    // Pickup: From User -> To Branch
    // Drop: From Branch -> To User

    const branchInfo = delivery.branch_name ? delivery.branch_name : "Branch";

    return (
        <Card className="p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {TIME_SLOT_LABELS[delivery.delivery_time] || delivery.delivery_time || "Scheduled"}
                    </span>
                    {delivery.payment_status !== 'paid' && delivery.order_total && <span className="text-xs font-bold text-red-600">Pending: {delivery.order_total}</span>}
                </div>
                <Badge className={`uppercase ${delivery.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {delivery.status.replace('_', ' ')}
                </Badge>
            </div>

            <div className="space-y-1 mb-3">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white truncate">{delivery.customer_name || "Unknown Customer"}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <FiPhone size={14} />
                    <a href={`tel:${delivery.delivery_contact || delivery.customer_phone}`} className="hover:text-blue-500">
                        {delivery.delivery_contact || delivery.customer_phone || "No Phone"}
                    </a>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm space-y-2 mb-3">
                <div className="flex items-start gap-2">
                    <div className="mt-1 min-w-[16px]"><FiMapPin className="text-gray-400" /></div>
                    <div>
                        <p className="font-semibold text-xs text-gray-500 uppercase">
                            {type === 'pickup' ? "Pickup Location" : "Delivery Location"}
                        </p>
                        <p className="text-gray-800 dark:text-gray-200 leading-snug">{delivery.delivery_address}</p>
                    </div>
                </div>

                {/* Route Info */}
                <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-600">
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                        {type === 'pickup' ? `To: ${branchInfo}` : `From: ${branchInfo}`}
                    </span>
                </div>
            </div>

            <div className="flex gap-2 mt-4">
                <a
                    href={delivery.map_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.delivery_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <FiMapPin /> Map
                </a>

                {delivery.status === 'pending' && (
                    <button
                        onClick={() => onStatusUpdate(delivery.id, 'in_progress')}
                        className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                        Start
                    </button>
                )}
                {delivery.status === 'in_progress' && (
                    <button
                        onClick={() => onStatusUpdate(delivery.id, 'delivered')}
                        className="flex-1 py-2 px-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                        Complete
                    </button>
                )}
                {delivery.status === 'delivered' && (
                    <button disabled className="flex-1 py-2 px-3 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
                        Done
                    </button>
                )}
            </div>
        </Card>
    );
};
