"use client";

import "../../types/i18n";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiMapPin, FiNavigation, FiClock, FiPackage, FiPhone, FiRefreshCw } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DeliveryLocation {
  id: string;
  customerName: string;
  address: string;
  phone: string;
  orderId: string;
  timeSlot: "morning" | "afternoon" | "evening";
  priority: "high" | "medium" | "low";
  status: "pending" | "in_transit" | "delivered";
  estimatedTime: string;
  lat: number;
  lng: number;
}

// Simple Card component
const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white shadow rounded-lg ${className}`}>{children}</div>
);

// Simple Badge component
const Badge: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${className}`}>{children}</span>
);

// Simple Select component
const Select: React.FC<{ value: string, onChange: (val: string) => void, options: { value: string, label: string }[] }> = ({ value, onChange, options }) => (
  <select
    className="border rounded px-3 py-1 bg-white"
    value={value}
    onChange={e => onChange(e.target.value)}
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

// Simple Tabs component
const Tabs: React.FC<{ tabs: { label: string, value: string }[], value: string, onChange: (val: string) => void }> = ({ tabs, value, onChange }) => (
  <div className="flex border-b">
    {tabs.map(tab => (
      <button
        key={tab.value}
        className={`px-4 py-2 -mb-px font-medium border-b-2 ${value === tab.value ? "border-blue-500 text-blue-600" : "border-transparent text-gray-600"}`}
        onClick={() => onChange(tab.value)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default function DeliveryDashboard() {
  const { t } = useTranslation();
  const [selectedShift, setSelectedShift] = useState("morning");
  const [selectedRoute, setSelectedRoute] = useState("optimized");
  const [tab, setTab] = useState("map");

  const deliveries: DeliveryLocation[] = [
    { id: "DEL-001", customerName: "Ram Sharma", address: "Thamel, Kathmandu", phone: "+977-9841234567", orderId: "ORD-001", timeSlot: "morning", priority: "high", status: "pending", estimatedTime: "09:30 AM", lat: 27.7172, lng: 85.3240 },
    { id: "DEL-002", customerName: "Sita Rai", address: "Patan Durbar Square", phone: "+977-9851234567", orderId: "ORD-002", timeSlot: "morning", priority: "medium", status: "pending", estimatedTime: "10:15 AM", lat: 27.6722, lng: 85.3256 },
    { id: "DEL-003", customerName: "John Doe", address: "Boudhanath Stupa", phone: "+977-9861234567", orderId: "ORD-003", timeSlot: "morning", priority: "low", status: "in_transit", estimatedTime: "11:00 AM", lat: 27.7215, lng: 85.3619 },
    { id: "DEL-004", customerName: "Maya Gurung", address: "Basantapur, Kathmandu", phone: "+977-9871234567", orderId: "ORD-004", timeSlot: "afternoon", priority: "high", status: "pending", estimatedTime: "02:30 PM", lat: 27.7043, lng: 85.3077 },
  ];

  const currentShiftDeliveries = deliveries.filter(d => d.timeSlot === selectedShift);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-300";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-blue-100 text-blue-800 border-blue-300";
      case "in_transit": return "bg-orange-100 text-orange-800 border-orange-300";
      case "delivered": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const optimizedRoute = ["DEL-001", "DEL-004", "DEL-002", "DEL-003"];

  const deliveryStatusData = [
    { name: t("delivery.pending") || "Pending", value: currentShiftDeliveries.filter(d => d.status === "pending").length },
    { name: t("delivery.inTransit") || "In Transit", value: currentShiftDeliveries.filter(d => d.status === "in_transit").length },
    { name: t("delivery.delivered") || "Delivered", value: currentShiftDeliveries.filter(d => d.status === "delivered").length },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 pt-16 md:pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("delivery.title") || "Delivery Dashboard"}</h1>
        <div className="flex gap-2">
          <Select value={selectedShift} onChange={setSelectedShift} options={[
            { value: "morning", label: t("delivery.morning") || "Morning Shift" },
            { value: "afternoon", label: t("delivery.afternoon") || "Afternoon Shift" },
            { value: "evening", label: t("delivery.evening") || "Evening Shift" },
          ]} />
          <button className="flex items-center gap-1 px-3 py-1 border rounded hover:bg-gray-100">
            <FiRefreshCw /> {t("common.refresh") || "Refresh"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={[
        { label: t("delivery.interactiveMap") || "Interactive Map", value: "map" },
        { label: t("delivery.deliveryList") || "Delivery List", value: "list" },
        { label: t("delivery.routeOptimization") || "Route Optimization", value: "route" }
      ]} value={tab} onChange={setTab} />

      {/* Tab Content */}
      <div className="space-y-4 mt-4">
        {tab === "map" && (
          <Card className="p-4">
            <h2 className="font-medium mb-2 flex items-center gap-2">
              <FiMapPin /> {t("delivery.mapView") || "Map View"}
            </h2>
            <div className="relative h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500">{t("delivery.mapPlaceholder") || "Map Placeholder"}</p>
            </div>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deliveryStatusData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {tab === "list" && (
          <div className="space-y-4">
            {currentShiftDeliveries.map((delivery, index) => (
              <Card key={delivery.id} className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{delivery.customerName}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1"><FiMapPin /> {delivery.address}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1"><FiPhone /> {delivery.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(delivery.priority)}>
                    {t(`delivery.priority.${delivery.priority}`) || delivery.priority}
                  </Badge>
                  <Badge className={getStatusColor(delivery.status)}>
                    {t(`delivery.status.${delivery.status}`) || delivery.status}
                  </Badge>
                  <button className="px-2 py-1 border rounded hover:bg-gray-100">
                    <FiNavigation />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "route" && (
          <Card className="p-4 space-y-4">
            <h2 className="font-medium flex items-center gap-2">
              <FiNavigation /> {t("delivery.routeOptimization") || "Route Optimization"}
            </h2>
            <div className="flex gap-2">
              <Select value={selectedRoute} onChange={setSelectedRoute} options={[
                { value: "optimized", label: t("delivery.shortestDistance") || "Shortest Distance" },
                { value: "fastest", label: t("delivery.fastestTime") || "Fastest Time" },
                { value: "priority", label: t("delivery.priorityBased") || "Priority Based" }
              ]} />
              <button className="flex items-center gap-1 px-3 py-1 border rounded hover:bg-gray-100">
                <FiRefreshCw /> {t("delivery.optimizeRoute") || "Optimize Route"}
              </button>
            </div>
            <div className="space-y-2 mt-4">
              {optimizedRoute.map((deliveryId, index) => {
                const delivery = deliveries.find(d => d.id === deliveryId);
                if (!delivery) return null;
                return (
                  <Card key={deliveryId} className="p-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">{index + 1}</div>
                      <div>
                        <p className="font-medium">{delivery.customerName}</p>
                        <p className="text-sm text-gray-500">{delivery.address}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{delivery.estimatedTime}</p>
                      <Badge className={getPriorityColor(delivery.priority)}>
                        {t(`delivery.priority.${delivery.priority}`) || delivery.priority}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
