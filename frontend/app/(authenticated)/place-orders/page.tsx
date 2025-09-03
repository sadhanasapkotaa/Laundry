"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { FaTshirt, FaBox, FaTrash } from "react-icons/fa";
import PaymentService from "../../services/paymentService";

// Dynamically import the MapAddressSelector to avoid SSR issues
const MapAddressSelector = dynamic(
  () => import("../../components/MapAddressSelector"),
  { ssr: false }
);

// Price table for cloth type + material
const prices: Record<string, Record<string, number>> = {
  saree: { siphon: 200, net: 250 },
  shirt: { cotton: 100, silk: 150 },
  pant: { cotton: 120, wool: 180 },
  coat: { wool: 300, leather: 500 },
  blouse: { cotton: 80, silk: 120 },
  blanket: { cotton: 400, wool: 500 },
  jacket: { down: 600, leather: 700 },
};

const clothNames = Object.keys(prices);
const clothMaterials = (cloth: string) => Object.keys(prices[cloth] || {});

interface Branch {
  id: number;
  name: string;
  branch_id: string;
  city: string;
  address: string;
  status: string;
}

export default function OrderForm() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  const [step, setStep] = useState(1);

  // Orders
  const [orders, setOrders] = useState<any[]>([]);

  // Current item
  const [clothName, setClothName] = useState("");
  const [material, setMaterial] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [clothType, setClothType] = useState<"individual" | "bulk">("individual");

  // Branch selection
  const [selectedBranch, setSelectedBranch] = useState<number | "">();

  // Pickup / Delivery
  const [pickupEnabled, setPickupEnabled] = useState(false);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);

  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupMapLink, setPickupMapLink] = useState("");

  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryMapLink, setDeliveryMapLink] = useState("");

  const [isUrgent, setIsUrgent] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<"esewa" | "bank" | "cash" | null>(null);

  const [errors, setErrors] = useState<string[]>([]);

  // Auto-load user and branches
  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setUser(data));

    // Fetch branches from the backend
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      console.log('Fetching branches...');
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE}/branches/`);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Raw API response:', result);
      
      // Handle different response structures
      let branchList = [];
      if (Array.isArray(result)) {
        branchList = result;
      } else if (result.results && Array.isArray(result.results)) {
        branchList = result.results;
      } else if (result.data && Array.isArray(result.data)) {
        branchList = result.data;
      } else {
        console.warn('Unexpected response structure:', result);
        branchList = [];
      }
      
      console.log('Processed branch list:', branchList);
      
      // Filter only active branches
      const activeBranches = branchList.filter((branch: Branch) => branch.status === 'active');
      console.log('Active branches:', activeBranches);
      
      setBranches(activeBranches);
      
      // Set first branch as default if available
      if (activeBranches.length > 0) {
        setSelectedBranch(activeBranches[0].id);
        console.log('Default branch selected:', activeBranches[0]);
      } else {
        console.warn('No active branches found');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      // Set empty array to prevent crashes
      setBranches([]);
      alert('Failed to load branches. Please check your connection and try again.');
    } finally {
      setBranchesLoading(false);
    }
  };

  // Check for pending order from eSewa payment return
  useEffect(() => {
    const checkForPendingOrder = () => {
      const pendingOrder = localStorage.getItem('pendingOrder');
      if (pendingOrder) {
        try {
          const orderData = JSON.parse(pendingOrder);
          
          // Check URL parameters for eSewa response
          const urlParams = new URLSearchParams(window.location.search);
          const oid = urlParams.get('oid');
          const amt = urlParams.get('amt');
          const refId = urlParams.get('refId');
          
          if (oid && amt && refId) {
            // eSewa payment successful
            console.log("eSewa payment successful:", { oid, amt, refId });
            
            // Place the order
            console.log("Placing order after eSewa payment:", orderData);
            
            // Here you would typically send the order to your backend
            // fetch('/api/orders', { method: 'POST', body: JSON.stringify(orderData) })
            
            const branchInfo = branches.find(b => b.id === orderData.selectedBranch);
            
            alert(`Order placed successfully! 
Total: Rs. ${orderData.total}
Order ID: ${oid}
Branch: ${branchInfo?.name || 'Unknown'} (${branchInfo?.branch_id || 'N/A'})
Payment Method: eSewa
Status: PAID
eSewa Reference: ${refId}`);
            
            // Clear pending order and reset form
            localStorage.removeItem('pendingOrder');
            setOrders([]);
            setStep(1);
            setPickupEnabled(false);
            setDeliveryEnabled(false);
            setPickupDate("");
            setPickupTime("");
            setPickupAddress("");
            setPickupMapLink("");
            setDeliveryDate("");
            setDeliveryTime("");
            setDeliveryAddress("");
            setDeliveryMapLink("");
            setIsUrgent(false);
            setSelectedPayment(null);
            setErrors([]);
            // Reset branch to first available branch
            if (branches.length > 0) {
              setSelectedBranch(branches[0].id);
            }
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            // Check if payment was cancelled or failed
            const failureReason = urlParams.get('failure_reason') || 'Payment was cancelled or failed';
            console.log("eSewa payment failed:", failureReason);
            alert(`eSewa payment failed: ${failureReason}`);
            localStorage.removeItem('pendingOrder');
          }
        } catch (error) {
          console.error("Error processing pending order:", error);
          localStorage.removeItem('pendingOrder');
        }
      }
    };

    // Check immediately and also after a short delay to ensure URL params are loaded
    checkForPendingOrder();
    const timeoutId = setTimeout(checkForPendingOrder, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const getPrice = () => {
    if (!clothName || !material) return 0;
    return (prices[clothName]?.[material] || 0) * quantity;
  };

  const addItem = () => {
    if (!clothName || !material || quantity <= 0 || !selectedBranch) {
      alert('Please fill in all fields including branch selection');
      return;
    }
    const item = { clothName, material, quantity, clothType, price: getPrice() };
    setOrders([...orders, item]);
    setClothName("");
    setMaterial("");
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setOrders(orders.filter((_, i) => i !== index));
  };

  const handlePickupAddressSelect = (address: string, mapLink: string) => {
    setPickupAddress(address);
    setPickupMapLink(mapLink);
  };

  const handleDeliveryAddressSelect = (address: string, mapLink: string) => {
    setDeliveryAddress(address);
    setDeliveryMapLink(mapLink);
  };

  const subtotal = orders.reduce((sum, item) => sum + item.price, 0);
  const pickupCost = pickupEnabled ? 200 : 0;
  const deliveryCost = deliveryEnabled ? 200 : 0;
  const urgentCost = isUrgent ? 500 : 0;
  const total = subtotal + pickupCost + deliveryCost + urgentCost;

  const validateStep2 = () => {
    const errs: string[] = [];
    const now = new Date();
    if (pickupEnabled && new Date(pickupDate + "T" + pickupTime) < now)
      errs.push("Pickup date/time cannot be before now.");
    if (
      pickupEnabled &&
      deliveryEnabled &&
      !isUrgent &&
      new Date(deliveryDate + "T" + deliveryTime) <
        new Date(new Date(pickupDate).getTime() + 3 * 24 * 60 * 60 * 1000)
    )
      errs.push("Delivery must be at least 3 days after pickup unless urgent.");
    setErrors(errs);
    return errs.length === 0;
  };

  const handlePayment = (method: "esewa" | "bank" | "cod") => {
    if (orders.length === 0) {
      setErrors(["Add at least one order before paying."]);
      return;
    }
    const payload = {
      user,
      orders,
      pickup: pickupEnabled
        ? { date: pickupDate, time: pickupTime, address: pickupAddress, map_link: pickupMapLink }
        : null,
      delivery: deliveryEnabled
        ? { date: deliveryDate, time: deliveryTime, address: deliveryAddress, map_link: deliveryMapLink }
        : null,
      isUrgent,
      paymentMethod: method,
      total,
    };
    console.log("Submitting payment:", payload);
    alert(`Paid via ${method.toUpperCase()}! Total: Rs. ${total}`);
  };

  const handlePayViaEsewa = async () => {
    if (orders.length === 0) {
      setErrors(["Add at least one order before paying."]);
      return;
    }
    
    try {
      setIsProcessingPayment(true);
      setSelectedPayment("esewa");
      
      // Store order data in localStorage before redirecting to eSewa
      const orderData = {
        user,
        orders,
        selectedBranch,
        pickup: pickupEnabled
          ? { date: pickupDate, time: pickupTime, address: pickupAddress, map_link: pickupMapLink }
          : null,
        delivery: deliveryEnabled
          ? { date: deliveryDate, time: deliveryTime, address: deliveryAddress, map_link: deliveryMapLink }
          : null,
        isUrgent,
        total,
        paymentMethod: "esewa",
        status: "paid",
      };
      
      localStorage.setItem('pendingOrder', JSON.stringify(orderData));
      
      const paymentResponse = await PaymentService.initiatePayment({
        payment_type: "esewa",
        amount: total,
        order_id: `ORDER-${Date.now()}`,
      });

      if (paymentResponse.success && paymentResponse.payment_data && paymentResponse.esewa_url) {
        alert(`Redirecting to eSewa for payment of Rs. ${total}...`);
        PaymentService.submitEsewaPayment(paymentResponse.payment_data, paymentResponse.esewa_url);
      } else {
        alert(`Failed to initiate eSewa payment: ${paymentResponse.error || "Unknown error"}`);
        setSelectedPayment(null);
        localStorage.removeItem('pendingOrder');
      }
    } catch (err) {
      console.error("eSewa payment error:", err);
      alert("Payment initiation failed. Please try again.");
      setSelectedPayment(null);
      localStorage.removeItem('pendingOrder');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleBankPayment = () => {
    alert("Please transfer the amount to our bank account:\n\nBank: Sample Bank\nAccount Name: Laundry Management System\nAccount Number: 1234567890\nSWIFT: SAMPLEBNK\n\nYour order will be marked as PAID after payment confirmation.");
    setSelectedPayment("bank");
  };

  const handlePlaceOrder = () => {
    if (orders.length === 0) {
      setErrors(["Add at least one order before placing the order."]);
      return;
    }

    if (!selectedPayment) {
      setErrors(["Please select a payment method."]);
      return;
    }

    if (!selectedBranch) {
      setErrors(["Please select a branch."]);
      return;
    }

    const status = selectedPayment === "cash" ? "pending" : "paid";

    const selectedBranchInfo = branches.find(b => b.id === selectedBranch);

    const payload = {
      user,
      orders,
      selectedBranch,
      branchInfo: selectedBranchInfo,
      pickup: pickupEnabled
        ? { date: pickupDate, time: pickupTime, address: pickupAddress, map_link: pickupMapLink }
        : null,
      delivery: deliveryEnabled
        ? { date: deliveryDate, time: deliveryTime, address: deliveryAddress, map_link: deliveryMapLink }
        : null,
      isUrgent,
      total,
      paymentMethod: selectedPayment,
      status,
    };

    console.log("Placing order:", payload);

    // Here you would typically send the order to your backend
    // fetch('/api/orders', { method: 'POST', body: JSON.stringify(payload) })

    alert(`Order placed successfully! 
Total: Rs. ${total}
Order ID: #${Date.now()}
Branch: ${selectedBranchInfo?.name} (${selectedBranchInfo?.branch_id})
Payment Method: ${selectedPayment.toUpperCase()}
Status: ${status.toUpperCase()}`);

    // Reset form after successful order
    setOrders([]);
    setStep(1);
    setPickupEnabled(false);
    setDeliveryEnabled(false);
    setPickupDate("");
    setPickupTime("");
    setPickupAddress("");
    setPickupMapLink("");
    setDeliveryDate("");
    setDeliveryTime("");
    setDeliveryAddress("");
    setDeliveryMapLink("");
    setIsUrgent(false);
    setSelectedPayment(null);
    setErrors([]);
    // Reset branch to first available branch
    if (branches.length > 0) {
      setSelectedBranch(branches[0].id);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Laundry Order Form</h1>

      <div className="flex mb-4 gap-2 text-sm">
        <div className={`flex-1 p-2 border rounded ${step === 1 ? "bg-blue-500 text-white" : ""}`}>1. Orders</div>
        <div className={`flex-1 p-2 border rounded ${step === 2 ? "bg-blue-500 text-white" : ""}`}>2. Pickup & Delivery</div>
        <div className={`flex-1 p-2 border rounded ${step === 3 ? "bg-blue-500 text-white" : ""}`}>3. Payment</div>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 text-red-600">
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {step === 1 && (
        <>
          {/* Branch Selection */}
          <div className="mb-4 border p-3 rounded bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Select Branch</h2>
              <button
                onClick={() => {
                  console.log('Refreshing branches...');
                  fetchBranches();
                }}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Refresh Branches
              </button>
            </div>
            {branchesLoading ? (
              <div className="text-blue-600 text-sm mb-2">
                Loading branches...
              </div>
            ) : branches.length === 0 ? (
              <div className="text-yellow-600 text-sm mb-2">
                No branches found. Please check your connection.
              </div>
            ) : (
              <div className="text-green-600 text-sm mb-2">
                {branches.length} active branch(es) available
              </div>
            )}
            <select
              className="border px-3 py-2 w-full"
              value={selectedBranch}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : "";
                console.log('Branch selection changed:', value);
                setSelectedBranch(value);
              }}
              required
            >
              <option value="">Select a branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.branch_id}) - {branch.city}
                </option>
              ))}
            </select>
            {selectedBranch && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {branches.find(b => b.id === selectedBranch)?.name} ({branches.find(b => b.id === selectedBranch)?.address})
              </div>
            )}
            {branches.length === 0 && (
              <div className="mt-2 text-red-600 text-sm">
                No branches available. Please contact support.
              </div>
            )}
          </div>

          {/* Cloth Type Selection */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setClothType("individual")}
              className={`flex-1 px-2 py-1 border rounded ${clothType === "individual" ? "bg-blue-500 text-white" : ""}`}
            >
              <FaTshirt /> Individual
            </button>
            <button
              onClick={() => setClothType("bulk")}
              className={`flex-1 px-2 py-1 border rounded ${clothType === "bulk" ? "bg-blue-500 text-white" : ""}`}
            >
              <FaBox /> Bulk
            </button>
          </div>

          {/* Individual Items Section */}
          {clothType === "individual" && (
            <div className="mb-4 border p-3 rounded">
              <h2 className="font-semibold mb-2">Individual Clothes</h2>
              <select
                className="border px-3 py-2 w-full mb-2"
                value={clothName}
                onChange={(e) => setClothName(e.target.value)}
              >
                <option value="">Select Cloth</option>
                {clothNames.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                className="border px-3 py-2 w-full mb-2"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                disabled={!clothName}
              >
                <option value="">Select Material</option>
                {clothName &&
                  clothMaterials(clothName).map((m) => (
                    <option key={m} value={m}>
                      {m} (Rs. {prices[clothName][m]} per piece)
                    </option>
                  ))}
              </select>

              <input
                type="number"
                min={1}
                className="border px-3 py-2 w-full mb-2"
                placeholder="Quantity (pieces)"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
              />

              <div className="mb-2 font-semibold">Subtotal: Rs. {getPrice()}</div>

              <button
                onClick={addItem}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Add to Order
              </button>
            </div>
          )}

          {/* Bulk Items Section */}
          {clothType === "bulk" && (
            <div className="mb-4 border p-3 rounded">
              <h2 className="font-semibold mb-2">Bulk Clothes</h2>
              <select
                className="border px-3 py-2 w-full mb-2"
                value={clothName}
                onChange={(e) => setClothName(e.target.value)}
              >
                <option value="">Select Cloth</option>
                {clothNames.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                className="border px-3 py-2 w-full mb-2"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                disabled={!clothName}
              >
                <option value="">Select Material</option>
                {clothName &&
                  clothMaterials(clothName).map((m) => (
                    <option key={m} value={m}>
                      {m} (Rs. {prices[clothName][m]} per kg)
                    </option>
                  ))}
              </select>

              <input
                type="number"
                min={1}
                className="border px-3 py-2 w-full mb-2"
                placeholder="Quantity (kg)"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
              />

              <div className="mb-2 font-semibold">Subtotal: Rs. {getPrice()}</div>

              <button
                onClick={addItem}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Add to Order
              </button>
            </div>
          )}

          {/* Current Orders */}
          {orders.length > 0 && (
            <div className="mb-4 border-t pt-2">
              <h2 className="font-semibold mb-2">Current Orders (Total: Rs. {subtotal})</h2>
              {orders.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 border rounded mb-1">
                  <span>
                    {item.clothName} ({item.material}) x{item.quantity} {item.clothType === "individual" ? "pcs" : "kg"} - Rs. {item.price}
                  </span>
                  <button onClick={() => removeItem(idx)} className="text-red-500"><FaTrash /></button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button 
              onClick={() => {
                if (!selectedBranch) {
                  setErrors(["Please select a branch before proceeding."]);
                  return;
                }
                if (orders.length === 0) {
                  setErrors(["Please add at least one item to your order before proceeding."]);
                  return;
                }
                setErrors([]);
                setStep(2);
              }} 
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Next
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={pickupEnabled} onChange={(e) => setPickupEnabled(e.target.checked)} />
              Pickup (Rs. 200 extra)
            </label>
            {pickupEnabled && (
              <div className="space-y-2 mt-2">
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="border px-2 py-1 w-full"
                />
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="border px-2 py-1 w-full"
                >
                  <option value="">Select Time Slot</option>
                  <option value="6-11">Morning (6 AM - 11 AM)</option>
                  <option value="12-16">Afternoon (12 PM - 4 PM)</option>
                  <option value="16-18">Evening (4 PM - 6 PM)</option>
                </select>
                <MapAddressSelector
                  onAddressSelect={handlePickupAddressSelect}
                  initialAddress={pickupAddress}
                  initialMapLink={pickupMapLink}
                  height="300px"
                />
              </div>
            )}

            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={deliveryEnabled} onChange={(e) => setDeliveryEnabled(e.target.checked)} />
              Delivery (Rs. 200 extra)
            </label>
            {deliveryEnabled && (
              <div className="space-y-2 mt-2">
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="border px-2 py-1 w-full"
                />
                <select
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="border px-2 py-1 w-full"
                >
                  <option value="">Select Time Slot</option>
                  <option value="6-11">Morning (6 AM - 11 AM)</option>
                  <option value="12-16">Afternoon (12 PM - 4 PM)</option>
                  <option value="16-18">Evening (4 PM - 6 PM)</option>
                </select>
                <MapAddressSelector
                  onAddressSelect={handleDeliveryAddressSelect}
                  initialAddress={deliveryAddress}
                  initialMapLink={deliveryMapLink}
                  height="300px"
                />
              </div>
            )}

            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
              Urgent (+500, delivered in 24h)
            </label>
          </div>

          <div className="mb-4 font-semibold">Total: Rs. {total}</div>

          <div className="flex justify-between gap-2">
            <button onClick={() => setStep(1)} className="bg-gray-500 text-white px-4 py-2 rounded">Back</button>
            <button
              onClick={() => { if(validateStep2()) setStep(3); }}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Next
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="mb-4">
            <h2 className="font-semibold mb-2">Order Summary</h2>
            
            {/* Branch Information */}
            {selectedBranch && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-medium text-blue-800">Selected Branch:</h3>
                <p className="text-blue-700">
                  {branches.find(b => b.id === selectedBranch)?.name} ({branches.find(b => b.id === selectedBranch)?.branch_id})
                </p>
                <p className="text-sm text-blue-600">
                  {branches.find(b => b.id === selectedBranch)?.address}, {branches.find(b => b.id === selectedBranch)?.city}
                </p>
              </div>
            )}

            {/* Order Items */}
            {orders.map((item, idx) => (
              <div key={idx} className="flex justify-between p-2 border rounded mb-1">
                <span>{item.clothName} ({item.material}) x{item.quantity}</span>
                <span>Rs. {item.price}</span>
              </div>
            ))}
            {pickupEnabled && <div className="p-2">Pickup: Rs. 200</div>}
            {deliveryEnabled && <div className="p-2">Delivery: Rs. 200</div>}
            {isUrgent && <div className="p-2">Urgent: Rs. 500</div>}
            <div className="font-bold mt-2">Total: Rs. {total}</div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2 text-gray-700">Choose Payment Method</h3>
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>eSewa Payment:</strong> You will be redirected to eSewa for payment. After completing payment, you'll return here and your order will be placed automatically.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handlePayViaEsewa} 
                disabled={isProcessingPayment}
                className={`bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded flex items-center justify-center ${
                  selectedPayment === "esewa" ? "ring-2 ring-yellow-400" : ""
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessingPayment && selectedPayment === "esewa" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Redirecting to eSewa...
                  </>
                ) : (
                  "Pay with eSewa (Redirects to eSewa)"
                )}
              </button>

              <button 
                onClick={handleBankPayment} 
                disabled={isProcessingPayment}
                className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded ${
                  selectedPayment === "bank" ? "ring-2 ring-yellow-400" : ""
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Pay via Bank
              </button>

              <button 
                onClick={() => setSelectedPayment("cash")} 
                disabled={isProcessingPayment}
                className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded ${
                  selectedPayment === "cash" ? "ring-2 ring-yellow-400" : ""
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cash on Delivery
              </button>
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <button onClick={() => setStep(2)} className="bg-gray-500 text-white px-4 py-2 rounded">Back</button>
            <button
              onClick={handlePlaceOrder}
              disabled={!selectedPayment || isProcessingPayment}
              className={`bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Place Order
            </button>
          </div>
        </>
      )}
    </div>
  );
}
