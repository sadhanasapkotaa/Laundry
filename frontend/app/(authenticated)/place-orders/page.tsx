"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FaTshirt, FaBox, FaTrash, FaShoppingCart, FaMapMarkerAlt } from "react-icons/fa";
import { branchAPI, Branch } from "../../services/branchService";
import { useAuth } from "../../contexts/AuthContext";

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

interface CartItem {
  id: string;
  clothName: string;
  material: string;
  quantity: number;
  clothType: "individual" | "bulk";
  price: number;
  unitPrice: number;
}

const TIME_SLOTS = [
  { value: 'early_morning', label: 'Early Morning (6am - 9am)' },
  { value: 'late_morning', label: 'Late Morning (9am - 12pm)' },
  { value: 'early_afternoon', label: 'Early Afternoon (12pm - 3pm)' },
  { value: 'late_afternoon', label: 'Late Afternoon (3pm - 6pm)' },
];

export default function OrderPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Branch state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Current item being added
  const [clothName, setClothName] = useState("");
  const [material, setMaterial] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [clothType, setClothType] = useState<"individual" | "bulk">("individual");

  // Service options
  const [pickupEnabled, setPickupEnabled] = useState(false);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  // Pickup details
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupMapLink, setPickupMapLink] = useState("");

  // Delivery details
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryMapLink, setDeliveryMapLink] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading] = useState(false);

  const fetchBranches = useCallback(async () => {
    try {
      setBranchesLoading(true);
      console.log('Starting to fetch branches...');

      const branchesArray = await branchAPI.list({ status: 'active' });
      console.log('Fetched branches array:', branchesArray);
      console.log('Number of branches:', branchesArray.length);

      setBranches(branchesArray);

      // Set first branch as default if available and no branch is selected
      if (branchesArray.length > 0 && !selectedBranch) {
        setSelectedBranch(branchesArray[0].id);
        console.log('Auto-selected first branch:', branchesArray[0].name);
      }
    } catch (error: unknown) {
      console.error('Error fetching branches:', error);
      setBranches([]);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors([`Error fetching branches: ${errorMessage}`]);
    } finally {
      setBranchesLoading(false);
    }
  }, [selectedBranch]);

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const getPrice = () => {
    if (!clothName || !material) return 0;
    return (prices[clothName]?.[material] || 0) * quantity;
  };

  const addToCart = () => {
    if (!clothName || !material || quantity <= 0 || !selectedBranch) {
      setErrors(['Please fill in all fields including branch selection']);
      return;
    }

    const unitPrice = prices[clothName]?.[material] || 0;
    const totalPrice = unitPrice * quantity;

    const item: CartItem = {
      id: Date.now().toString(),
      clothName,
      material,
      quantity,
      clothType,
      price: totalPrice,
      unitPrice
    };

    setCart([...cart, item]);
    setClothName("");
    setMaterial("");
    setQuantity(1);
    setErrors([]);
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(cart.map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, price: item.unitPrice * newQuantity }
        : item
    ));
  };

  const handlePickupAddressSelect = (address: string, mapLink: string) => {
    setPickupAddress(address);
    setPickupMapLink(mapLink);
  };

  const handleDeliveryAddressSelect = (address: string, mapLink: string) => {
    setDeliveryAddress(address);
    setDeliveryMapLink(mapLink);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const pickupCost = pickupEnabled ? 200 : 0;
  const deliveryCost = deliveryEnabled ? 200 : 0;
  const urgentCost = isUrgent ? 500 : 0;
  const total = subtotal + pickupCost + deliveryCost + urgentCost;

  const validateOrder = () => {
    const errs: string[] = [];

    if (!selectedBranch) errs.push("Please select a branch.");
    if (cart.length === 0) errs.push("Please add at least one item to your cart.");
    if (!user && !authLoading) errs.push("Please log in to place an order.");

    if (pickupEnabled) {
      if (!pickupDate) errs.push("Please select pickup date.");
      if (!pickupTime) errs.push("Please select pickup time.");
      if (!pickupAddress) errs.push("Please provide pickup address.");
    }

    if (deliveryEnabled) {
      if (!deliveryDate) errs.push("Please select delivery date.");
      if (!deliveryTime) errs.push("Please select delivery time.");
      if (!deliveryAddress) errs.push("Please provide delivery address.");
    }

    // Helper for validation
    const getSlotTime = (slot: string) => {
      if (slot === 'early_morning') return '06:00';
      if (slot === 'late_morning') return '09:00';
      if (slot === 'early_afternoon') return '12:00';
      if (slot === 'late_afternoon') return '15:00';
      if (slot === 'evening') return '18:00'; # Just in case legacy
      return '00:00';
    };

    // Date validation
    const now = new Date();
    if (pickupEnabled && pickupDate && pickupTime) {
      const pickupDateTime = new Date(`${pickupDate}T${getSlotTime(pickupTime)}`);
      if (pickupDateTime < now) {
        errs.push("Pickup date and time cannot be in the past.");
      }
    }

    if (deliveryEnabled && deliveryDate && deliveryTime) {
      const deliveryDateTime = new Date(`${deliveryDate}T${getSlotTime(deliveryTime)}`);
      if (deliveryDateTime < now) {
        errs.push("Delivery date and time cannot be in the past.");
      }

      // If both pickup and delivery are enabled, delivery should be after pickup
      if (pickupEnabled && pickupDate && pickupTime && !isUrgent) {
        const pickupDateTime = new Date(`${pickupDate}T${getSlotTime(pickupTime)}`);
        const deliveryDateTime = new Date(`${deliveryDate}T${getSlotTime(deliveryTime)}`);
        const minDeliveryTime = new Date(pickupDateTime.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days later
        if (deliveryDateTime < minDeliveryTime) {
          errs.push("Delivery must be at least 3 days after pickup (unless urgent service is selected).");
        }
      }
    }

    setErrors(errs);
    return errs.length === 0;
  };
  const errs: string[] = [];

  if (!selectedBranch) errs.push("Please select a branch.");
  if (cart.length === 0) errs.push("Please add at least one item to your cart.");
  if (!user && !authLoading) errs.push("Please log in to place an order.");

  if (pickupEnabled) {
    if (!pickupDate) errs.push("Please select pickup date.");
    if (!pickupTime) errs.push("Please select pickup time.");
    if (!pickupAddress) errs.push("Please provide pickup address.");
  }

  if (deliveryEnabled) {
    if (!deliveryDate) errs.push("Please select delivery date.");
    if (!deliveryTime) errs.push("Please select delivery time.");
    if (!deliveryAddress) errs.push("Please provide delivery address.");
  }

  // Date validation
  const now = new Date();
  if (pickupEnabled && pickupDate && pickupTime) {
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
    if (pickupDateTime < now) {
      errs.push("Pickup date and time cannot be in the past.");
    }
  }

  if (deliveryEnabled && deliveryDate && deliveryTime) {
    const deliveryDateTime = new Date(`${deliveryDate}T${deliveryTime}`);
    if (deliveryDateTime < now) {
      errs.push("Delivery date and time cannot be in the past.");
    }

    // If both pickup and delivery are enabled, delivery should be after pickup
    if (pickupEnabled && pickupDate && pickupTime && !isUrgent) {
      const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
      const minDeliveryTime = new Date(pickupDateTime.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days later
      if (deliveryDateTime < minDeliveryTime) {
        errs.push("Delivery must be at least 3 days after pickup (unless urgent service is selected).");
      }
    }
  }

  setErrors(errs);
  return errs.length === 0;
};

const proceedToCheckout = () => {
  if (!validateOrder()) {
    return;
  }

  // Prepare order data for checkout
  const orderData = {
    branch: selectedBranch,
    branchInfo: branches.find(b => b.id === selectedBranch),
    cart,
    services: {
      pickupEnabled,
      deliveryEnabled,
      isUrgent,
    },
    pickup: pickupEnabled ? {
      date: pickupDate,
      time: pickupTime,
      address: pickupAddress,
      map_link: pickupMapLink,
    } : null,
    delivery: deliveryEnabled ? {
      date: deliveryDate,
      time: deliveryTime,
      address: deliveryAddress,
      map_link: deliveryMapLink,
    } : null,
    pricing: {
      subtotal,
      pickupCost,
      deliveryCost,
      urgentCost,
      total,
    },
    user: user?.id,
  };

  // Store order data in localStorage for checkout page
  localStorage.setItem('orderData', JSON.stringify(orderData));

  // Navigate to checkout
  router.push('/place-orders/checkout');
};

const selectedBranchInfo = branches.find(b => b.id === selectedBranch);

if (authLoading) {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
      <div className="text-center">Loading...</div>
    </div>
  );
}

return (
  <div className="max-w-6xl mx-auto p-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Order Form */}
      <div className="lg:col-span-2">
        <div className="bg-white shadow rounded p-6">
          <h1 className="text-2xl font-bold mb-6">Place Your Order</h1>

          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-semibold text-red-800 mb-2">Please fix the following issues:</h3>
              <ul className="list-disc list-inside text-red-700">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Branch Selection */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Select Branch</h2>
            <div className="border rounded-lg p-4 bg-gray-50">
              {branchesLoading ? (
                <div className="text-blue-600">Loading branches...</div>
              ) : (
                <>
                  <select
                    className="w-full border rounded px-3 py-2 mb-2"
                    value={selectedBranch || ""}
                    onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Select a branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} - {branch.city}
                      </option>
                    ))}
                  </select>
                  {selectedBranchInfo && (
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <FaMapMarkerAlt />
                      {selectedBranchInfo.address}, {selectedBranchInfo.city}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Item Type Selection */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Item Type</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setClothType("individual")}
                className={`flex-1 px-4 py-2 border rounded-lg flex items-center justify-center gap-2 ${clothType === "individual" ? "bg-blue-500 text-white" : "bg-white hover:bg-gray-50"
                  }`}
              >
                <FaTshirt /> Individual Items
              </button>
              <button
                onClick={() => setClothType("bulk")}
                className={`flex-1 px-4 py-2 border rounded-lg flex items-center justify-center gap-2 ${clothType === "bulk" ? "bg-blue-500 text-white" : "bg-white hover:bg-gray-50"
                  }`}
              >
                <FaBox /> Bulk Items
              </button>
            </div>
          </div>

          {/* Item Selection */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Add Items</h2>
            <div className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cloth Type</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={clothName}
                    onChange={(e) => setClothName(e.target.value)}
                  >
                    <option value="">Select cloth type</option>
                    {clothNames.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Material</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    disabled={!clothName}
                  >
                    <option value="">Select material</option>
                    {clothName &&
                      clothMaterials(clothName).map((m) => (
                        <option key={m} value={m}>
                          {m.charAt(0).toUpperCase() + m.slice(1)} - Rs. {prices[clothName][m]} per {clothType === "individual" ? "piece" : "kg"}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Quantity ({clothType === "individual" ? "pieces" : "kg"})
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border rounded px-3 py-2"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <div className="px-3 py-2 bg-gray-100 border rounded font-semibold">
                    Rs. {getPrice()}
                  </div>
                </div>
              </div>

              <button
                onClick={addToCart}
                disabled={!clothName || !material || quantity <= 0}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Add to Cart
              </button>
            </div>
          </div>

          {/* Service Options */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Service Options</h2>
            <div className="space-y-4">
              {/* Pickup Option */}
              <div className="border rounded-lg p-4">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={pickupEnabled}
                    onChange={(e) => setPickupEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Pickup Service (+Rs. 200)</span>
                </label>
                {pickupEnabled && (
                  <div className="ml-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Pickup Date</label>
                        <input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          className="w-full border rounded px-3 py-2"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Pickup Time</label>
                        <select
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full border rounded px-3 py-2 bg-white"
                        >
                          <option value="">Select Time Slot</option>
                          {TIME_SLOTS.map(slot => (
                            <option key={slot.value} value={slot.value}>{slot.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Pickup Address</label>
                      <MapAddressSelector
                        onAddressSelect={handlePickupAddressSelect}
                        initialAddress={pickupAddress}
                        initialMapLink={pickupMapLink}
                        height="200px"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Option */}
              <div className="border rounded-lg p-4">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={deliveryEnabled}
                    onChange={(e) => setDeliveryEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Delivery Service (+Rs. 200)</span>
                </label>
                {deliveryEnabled && (
                  <div className="ml-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Delivery Date</label>
                        <input
                          type="date"
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="w-full border rounded px-3 py-2"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Delivery Time</label>
                        <select
                          value={deliveryTime}
                          onChange={(e) => setDeliveryTime(e.target.value)}
                          className="w-full border rounded px-3 py-2 bg-white"
                        >
                          <option value="">Select Time Slot</option>
                          {TIME_SLOTS.map(slot => (
                            <option key={slot.value} value={slot.value}>{slot.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Delivery Address</label>
                      <MapAddressSelector
                        onAddressSelect={handleDeliveryAddressSelect}
                        initialAddress={deliveryAddress}
                        initialMapLink={deliveryMapLink}
                        height="200px"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Urgent Option */}
              <div className="border rounded-lg p-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Urgent Service (+Rs. 500)</span>
                  <span className="text-sm text-gray-600">- Delivered within 24 hours</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white shadow rounded p-6 sticky top-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaShoppingCart />
            Your Cart ({cart.length} items)
          </h2>

          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <FaShoppingCart className="mx-auto text-4xl mb-2 opacity-50" />
              <p>Your cart is empty</p>
              <p className="text-sm">Add items to get started</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="border rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.clothName}</h4>
                        <p className="text-sm text-gray-600">{item.material}</p>
                        <p className="text-sm text-gray-600">
                          Rs. {item.unitPrice} per {item.clothType === "individual" ? "piece" : "kg"}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      <div className="font-semibold">Rs. {item.price}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rs. {subtotal}</span>
                </div>
                {pickupEnabled && (
                  <div className="flex justify-between text-sm">
                    <span>Pickup Service:</span>
                    <span>Rs. {pickupCost}</span>
                  </div>
                )}
                {deliveryEnabled && (
                  <div className="flex justify-between text-sm">
                    <span>Delivery Service:</span>
                    <span>Rs. {deliveryCost}</span>
                  </div>
                )}
                {isUrgent && (
                  <div className="flex justify-between text-sm">
                    <span>Urgent Service:</span>
                    <span>Rs. {urgentCost}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>Rs. {total}</span>
                </div>
              </div>

              <button
                onClick={proceedToCheckout}
                disabled={cart.length === 0 || !selectedBranch || isLoading}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-semibold text-lg"
              >
                {isLoading ? "Processing..." : "Proceed to Checkout"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  </div >
);
}