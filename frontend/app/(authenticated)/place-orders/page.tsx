"use client";

import React, { useState, useEffect } from "react";

// Mock types for services, branches
type Service = { id: string; name: string; price: number };
type Branch = { id: string; name: string };

export default function OrderPage() {
  const [step, setStep] = useState(1);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [deliveryRequested, setDeliveryRequested] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryTime, setDeliveryTime] = useState<"morning" | "afternoon" | "evening">("morning");
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // Mock data fetch (replace with real API fetch)
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    // Mock fetch
    setServices([
      { id: "1", name: "Wash & Fold", price: 200 },
      { id: "2", name: "Dry Cleaning", price: 500 },
      { id: "3", name: "Ironing", price: 150 },
    ]);
    setBranches([
      { id: "1", name: "Thamel Branch" },
      { id: "2", name: "Patan Branch" },
    ]);
  }, []);

  // Update total amount when service changes
  useEffect(() => {
    if (selectedService) setTotalAmount(selectedService.price);
    else setTotalAmount(0);
  }, [selectedService]);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handlePlaceOrder = async () => {
    // Replace this with actual POST API call to your Django backend
    const payload = {
      customer_name: customerName,
      service_id: selectedService?.id,
      branch_id: selectedBranch?.id,
      delivery_requested: deliveryRequested,
      delivery_address: deliveryAddress,
      delivery_time: deliveryTime,
      total_amount: totalAmount,
    };

    console.log("Placing order:", payload);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to place order");

      const data = await res.json();
      alert("Order placed successfully! Order ID: " + data.order_id);

      // Reset form
      setStep(1);
      setCustomerName("");
      setSelectedService(null);
      setSelectedBranch(null);
      setDeliveryRequested(false);
      setDeliveryAddress("");
      setDeliveryTime("morning");
      setTotalAmount(0);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Place Laundry Order</h1>

      {/* Stepper */}
      <div className="flex justify-between mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 border-b-2 ${step === s ? "border-blue-500" : "border-gray-300"} text-center`}>
            Step {s}
          </div>
        ))}
      </div>

      {/* Step 1: Customer & Service */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Customer Name</label>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Select Service</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={selectedService?.id || ""}
              onChange={(e) => setSelectedService(services.find(s => s.id === e.target.value) || null)}
            >
              <option value="">Select a service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - ₹{s.price}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Select Branch</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={selectedBranch?.id || ""}
              onChange={(e) => setSelectedBranch(branches.find(b => b.id === e.target.value) || null)}
            >
              <option value="">Select a branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              disabled={!customerName || !selectedService || !selectedBranch}
              onClick={handleNext}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Delivery */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={deliveryRequested}
              onChange={(e) => setDeliveryRequested(e.target.checked)}
            />
            <span>Request Delivery</span>
          </div>

          {deliveryRequested && (
            <>
              <div>
                <label className="block font-medium mb-1">Delivery Address</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Delivery Time</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value as "morning" | "afternoon" | "evening")}
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </>
          )}

          <div className="flex justify-between">
            <button onClick={handleBack} className="px-4 py-2 border rounded">
              Back
            </button>
            <button onClick={handleNext} className="px-4 py-2 bg-blue-500 text-white rounded">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment & Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <p>Total Amount: <span className="font-bold">₹{totalAmount}</span></p>
          </div>

          {/* Here you could integrate Stripe/PayPal */}
          <div>
            <p className="text-gray-500 text-sm">Payment integration placeholder</p>
          </div>

          <div className="flex justify-between">
            <button onClick={handleBack} className="px-4 py-2 border rounded">
              Back
            </button>
            <button
              onClick={handlePlaceOrder}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
