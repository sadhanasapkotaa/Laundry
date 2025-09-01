"use client";

import React, { useState } from "react";

// This is the page where the customer can place an order
// const PaymentHistoryPage = React.lazy(() => import("../payment-history/page"));
const mockServices = [
  { id: 1, name: "Wash & Fold" },
  { id: 2, name: "Dry Cleaning" },
  { id: 3, name: "Ironing" },
];
const mockBranches = [
  { id: 1, name: "Main Branch" },
  { id: 2, name: "City Center" },
];

export default function PlaceOrderPage() {
  const [service, setService] = useState("");
  const [branch, setBranch] = useState("");
  const [pickup, setPickup] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    // TODO: Replace with actual API call
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setService("");
      setBranch("");
      setPickup(false);
      setDelivery(false);
      setDescription("");
    }, 1200);
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-8 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Place a New Order</h1>
      {success && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Order placed successfully!
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Service</label>
          <select
            className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={service}
            onChange={e => setService(e.target.value)}
            required
          >
            <option value="">Select a service</option>
            {mockServices.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Branch</label>
          <select
            className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={branch}
            onChange={e => setBranch(e.target.value)}
            required
          >
            <option value="">Select a branch</option>
            {mockBranches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={pickup}
              onChange={e => setPickup(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="text-gray-700 dark:text-gray-200">Request Pickup</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={delivery}
              onChange={e => setDelivery(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="text-gray-700 dark:text-gray-200">Request Delivery</span>
          </label>
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Description (optional)</label>
          <textarea
            className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe your order, special instructions, etc."
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Placing Order..." : "Place Order"}
        </button>
      </form>
    </div>
  );
}        // <Suspense fallback={<div>Loading Payment History...</div>}>
        //   <PaymentHistoryPage />
        // </Suspense>
