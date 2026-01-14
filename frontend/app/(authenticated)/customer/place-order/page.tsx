"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FaTshirt, FaBox, FaTrash, FaShoppingCart, FaMapMarkerAlt, FaPlus, FaStore, FaClock, FaCalendar, FaMinus } from "react-icons/fa";
import { branchAPI, Branch } from "../../../services/branchService";
import { addressAPI, UserAddress } from "../../../services/addressService";
import { useAuth } from "../../../contexts/AuthContext";
import {
  washTypeAPI, clothNameAPI, clothTypeAPI, pricingRuleAPI,
  WashType, ClothName, ClothType, PricingRule
} from "../../../services/settingsService";

// Dynamically import the MapAddressSelector to avoid SSR issues
const MapAddressSelector = dynamic(
  () => import("../../../components/MapAddressSelector"),
  { ssr: false }
);

interface CartItem {
  id: string;
  washTypeId: number;
  washTypeName: string;
  clothNameId: number;
  clothName: string;
  clothTypeId: number;
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

export default function CustomerPlaceOrderPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Branch state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);

  // Services data from API
  const [washTypes, setWashTypes] = useState<WashType[]>([]);
  const [clothNames, setClothNames] = useState<ClothName[]>([]);
  const [clothTypes, setClothTypes] = useState<ClothType[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Current item being added
  const [selectedWashType, setSelectedWashType] = useState<number | null>(null);
  const [selectedClothName, setSelectedClothName] = useState<number | null>(null);
  const [selectedClothType, setSelectedClothType] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [clothTypeMode, setClothTypeMode] = useState<"individual" | "bulk">("individual");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

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

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedPickupAddressId, setSelectedPickupAddressId] = useState<number | null>(null);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<number | null>(null);
  const [showNewPickupAddress, setShowNewPickupAddress] = useState(false);
  const [showNewDeliveryAddress, setShowNewDeliveryAddress] = useState(false);
  const [savePickupAddress, setSavePickupAddress] = useState(false);
  const [saveDeliveryAddress, setSaveDeliveryAddress] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);

  // Fetch services data (wash types, cloth names, cloth types, pricing rules)
  const fetchServicesData = useCallback(async () => {
    try {
      setServicesLoading(true);
      const [washData, clothNameData, clothTypeData, pricingData] = await Promise.all([
        washTypeAPI.list(),
        clothNameAPI.list(),
        clothTypeAPI.list(),
        pricingRuleAPI.list()
      ]);
      setWashTypes(washData);
      setClothNames(clothNameData);
      setClothTypes(clothTypeData);
      setPricingRules(pricingData);
    } catch (error) {
      console.error('Error fetching services data:', error);
      setErrors(prev => [...prev, 'Failed to load service options']);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  // Fetch saved addresses
  const fetchAddresses = useCallback(async () => {
    try {
      setAddressesLoading(true);
      const addresses = await addressAPI.list();
      setSavedAddresses(addresses);

      // Auto-select default addresses if available
      const defaultPickup = addresses.find(
        a => a.is_default && (a.address_type === 'pickup' || a.address_type === 'both')
      );
      const defaultDelivery = addresses.find(
        a => a.is_default && (a.address_type === 'delivery' || a.address_type === 'both')
      );

      if (defaultPickup) {
        setSelectedPickupAddressId(defaultPickup.id);
        setPickupAddress(defaultPickup.address);
        setPickupMapLink(defaultPickup.map_link || '');
      }
      if (defaultDelivery) {
        setSelectedDeliveryAddressId(defaultDelivery.id);
        setDeliveryAddress(defaultDelivery.address);
        setDeliveryMapLink(defaultDelivery.map_link || '');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      setBranchesLoading(true);
      const branchesArray = await branchAPI.list({ status: 'active' });
      setBranches(branchesArray);

      // Set first branch as default if available and no branch is selected
      if (branchesArray.length > 0 && !selectedBranch) {
        setSelectedBranch(branchesArray[0].id);
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

  // Fetch branches and addresses on mount
  useEffect(() => {
    fetchBranches();
    fetchAddresses();
    fetchServicesData();
  }, [fetchBranches, fetchAddresses, fetchServicesData]);

  // Lookup price when wash type, cloth name, or cloth type changes
  useEffect(() => {
    const lookupPrice = async () => {
      if (selectedWashType && selectedClothName && selectedClothType) {
        setPriceLoading(true);
        try {
          // First try to find in cached pricing rules
          const cachedRule = pricingRules.find(
            r => r.wash_type === selectedWashType &&
              r.cloth_name === selectedClothName &&
              r.cloth_type === selectedClothType &&
              r.is_active
          );
          if (cachedRule) {
            setCurrentPrice(parseFloat(cachedRule.price));
          } else {
            // Fallback to API lookup
            const result = await pricingRuleAPI.lookup(selectedWashType, selectedClothName, selectedClothType);
            setCurrentPrice(result.price ? parseFloat(result.price) : null);
          }
        } catch (error) {
          console.error('Error looking up price:', error);
          setCurrentPrice(null);
        } finally {
          setPriceLoading(false);
        }
      } else {
        setCurrentPrice(null);
      }
    };
    lookupPrice();
  }, [selectedWashType, selectedClothName, selectedClothType, pricingRules]);

  // Get pickup addresses (type 'pickup' or 'both')
  const pickupAddresses = savedAddresses.filter(
    a => a.address_type === 'pickup' || a.address_type === 'both'
  );

  // Get delivery addresses (type 'delivery' or 'both')
  const deliveryAddresses = savedAddresses.filter(
    a => a.address_type === 'delivery' || a.address_type === 'both'
  );

  // Handle saved address selection for pickup
  const handlePickupAddressSelection = (addressId: number | null) => {
    setSelectedPickupAddressId(addressId);
    if (addressId === null) {
      setShowNewPickupAddress(true);
      setPickupAddress('');
      setPickupMapLink('');
    } else {
      setShowNewPickupAddress(false);
      const address = savedAddresses.find(a => a.id === addressId);
      if (address) {
        setPickupAddress(address.address);
        setPickupMapLink(address.map_link || '');
      }
    }
  };

  // Handle saved address selection for delivery
  const handleDeliveryAddressSelection = (addressId: number | null) => {
    setSelectedDeliveryAddressId(addressId);
    if (addressId === null) {
      setShowNewDeliveryAddress(true);
      setDeliveryAddress('');
      setDeliveryMapLink('');
    } else {
      setShowNewDeliveryAddress(false);
      const address = savedAddresses.find(a => a.id === addressId);
      if (address) {
        setDeliveryAddress(address.address);
        setDeliveryMapLink(address.map_link || '');
      }
    }
  };

  // Save new address to backend
  const saveNewAddress = async (
    address: string,
    mapLink: string,
    type: 'pickup' | 'delivery'
  ) => {
    try {
      const newAddress = await addressAPI.create({
        address,
        map_link: mapLink || undefined,
        address_type: type,
        is_default: false,
      });
      setSavedAddresses(prev => [...prev, newAddress]);
      return newAddress;
    } catch (error) {
      console.error('Error saving address:', error);
      return null;
    }
  };


  const getPrice = () => {
    if (!currentPrice) return 0;
    return currentPrice * quantity;
  };

  const addToCart = () => {
    if (!selectedWashType || !selectedClothName || !selectedClothType || quantity <= 0 || !selectedBranch) {
      setErrors(['Please fill in all fields including branch selection']);
      return;
    }

    if (!currentPrice) {
      setErrors(['No pricing rule found for this combination. Please contact support.']);
      return;
    }

    const unitPrice = currentPrice;
    const totalPrice = unitPrice * quantity;

    // Get the names for display
    const washType = washTypes.find(w => w.id === selectedWashType);
    const clothName = clothNames.find(c => c.id === selectedClothName);
    const clothType = clothTypes.find(t => t.id === selectedClothType);

    const item: CartItem = {
      id: Date.now().toString(),
      washTypeId: selectedWashType,
      washTypeName: washType?.name || '',
      clothNameId: selectedClothName,
      clothName: clothName?.name || '',
      clothTypeId: selectedClothType,
      material: clothType?.name || '',
      quantity,
      clothType: clothTypeMode,
      price: totalPrice,
      unitPrice
    };

    setCart([...cart, item]);
    setSelectedWashType(null);
    setSelectedClothName(null);
    setSelectedClothType(null);
    setQuantity(1);
    setCurrentPrice(null);
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
        const minDeliveryTime = new Date(pickupDateTime.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days later
        if (deliveryDateTime < minDeliveryTime) {
          errs.push("Delivery must be at least 3 days after pickup (unless urgent service is selected).");
        }
      }
    }

    setErrors(errs);
    return errs.length === 0;
  };

  const proceedToCheckout = async () => {
    if (!validateOrder()) {
      return;
    }

    // Save new addresses if user checked the save checkbox
    if (pickupEnabled && savePickupAddress && pickupAddress && selectedPickupAddressId === null) {
      await saveNewAddress(pickupAddress, pickupMapLink, 'pickup');
    }
    if (deliveryEnabled && saveDeliveryAddress && deliveryAddress && selectedDeliveryAddressId === null) {
      await saveNewAddress(deliveryAddress, deliveryMapLink, 'delivery');
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
    localStorage.setItem('customerOrderData', JSON.stringify(orderData));

    // Navigate to customer checkout
    router.push('/customer/place-order/checkout');
  };

  const selectedBranchInfo = branches.find(b => b.id === selectedBranch);

  if (authLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
        Loading auth...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Place New Order
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Customize your laundry service
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Order Form (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">

          {errors.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Please fix the following issues:</h3>
              <ul className="list-disc list-inside text-red-600 dark:text-red-300 text-sm">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Branch Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4 text-gray-900 dark:text-gray-100">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                <FaStore />
              </div>
              <h2 className="text-lg font-bold">Select Branch</h2>
            </div>

            {branchesLoading ? (
              <p className="text-gray-400 text-sm">Loading branches...</p>
            ) : (
              <div className="space-y-4">
                <select
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 transition-all"
                  value={selectedBranch || ""}
                  onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Choose a nearby branch...</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} - {branch.city}
                    </option>
                  ))}
                </select>
                {selectedBranchInfo && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-200 rounded-xl text-sm">
                    <FaMapMarkerAlt className="mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold block mb-0.5">{selectedBranchInfo.name}</span>
                      <span className="opacity-80">{selectedBranchInfo.address}, {selectedBranchInfo.city}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add Items */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6 text-gray-900 dark:text-gray-100">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg text-purple-600 dark:text-purple-400">
                <FaTshirt />
              </div>
              <h2 className="text-lg font-bold">Add Items</h2>
            </div>

            {servicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-2"></div>
                <span className="text-gray-500">Loading service options...</span>
              </div>
            ) : (
              <>
                {/* Type Toggles */}
                <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
                  <button
                    onClick={() => setClothTypeMode("individual")}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${clothTypeMode === "individual"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                      }`}
                  >
                    <FaTshirt /> Individual
                  </button>
                  <button
                    onClick={() => setClothTypeMode("bulk")}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${clothTypeMode === "bulk"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                      }`}
                  >
                    <FaBox /> Bulk (Kg)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Wash Type Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Wash Type</label>
                    <select
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      value={selectedWashType || ""}
                      onChange={(e) => setSelectedWashType(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Select wash type...</option>
                      {washTypes.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cloth Name Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Item Type</label>
                    <select
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      value={selectedClothName || ""}
                      onChange={(e) => setSelectedClothName(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Select item...</option>
                      {clothNames.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cloth Type (Material) Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Material</label>
                    <select
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      value={selectedClothType || ""}
                      onChange={(e) => setSelectedClothType(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Select material...</option>
                      {clothTypes.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quantity</label>
                    <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 border-r border-gray-200 dark:border-gray-600"
                      >
                        <FaMinus className="text-gray-500" size={12} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        className="w-full bg-transparent text-center outline-none px-2 text-gray-900 dark:text-gray-100 font-semibold"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 border-l border-gray-200 dark:border-gray-600"
                      >
                        <FaPlus className="text-gray-500" size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 w-full sm:w-auto">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Est. Price</label>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3 font-mono font-bold text-gray-900 dark:text-gray-100 text-center">
                      {priceLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : currentPrice === null && selectedWashType && selectedClothName && selectedClothType ? (
                        <span className="text-red-500 text-sm">No price set</span>
                      ) : (
                        `₨ ${getPrice().toLocaleString()}`
                      )}
                    </div>
                  </div>

                  <button
                    onClick={addToCart}
                    disabled={!selectedWashType || !selectedClothName || !selectedClothType || quantity <= 0 || !currentPrice}
                    className="w-full sm:w-auto px-6 py-3 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-bold rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none whitespace-nowrap"
                  >
                    Add to Cart
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Service Options */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6 text-gray-900 dark:text-gray-100">
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-green-600 dark:text-green-400">
                <FaClock />
              </div>
              <h2 className="text-lg font-bold">Logistics & Services</h2>
            </div>

            <div className="space-y-6">
              {/* Pickup Toggle */}
              <div className={`border rounded-xl p-5 transition-all ${pickupEnabled ? 'border-green-500 bg-green-50/10' : 'border-gray-200 dark:border-gray-700'}`}>
                <label className="flex items-center justify-between cursor-pointer w-full">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${pickupEnabled ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {pickupEnabled && <FaPlus className="text-white rotate-45" size={10} />}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-gray-100 block">Pickup Service</span>
                      <span className="text-sm text-gray-500">We collect your laundry (+₨ 200)</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={pickupEnabled}
                    onChange={(e) => setPickupEnabled(e.target.checked)}
                    className="hidden"
                  />
                </label>

                {pickupEnabled && (
                  <div className="mt-6 pl-2 sm:pl-8 space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <FaCalendar className="absolute left-3 top-3.5 text-gray-400" />
                        <input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500/20"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="relative">
                        <FaClock className="absolute left-3 top-3.5 text-gray-400" />
                        <select
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500/20 appearance-none"
                        >
                          <option value="">Select Time Slot</option>
                          {TIME_SLOTS.map(slot => (
                            <option key={slot.value} value={slot.value}>{slot.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pickup Address</label>
                      <select
                        className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-green-500/20"
                        value={selectedPickupAddressId || "new"}
                        onChange={(e) => {
                          const val = e.target.value;
                          handlePickupAddressSelection(val === "new" ? null : parseInt(val));
                        }}
                        disabled={addressesLoading}
                      >
                        {pickupAddresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>{addr.address}</option>
                        ))}
                        <option value="new">+ Add New Address</option>
                      </select>

                      {(pickupAddresses.length === 0 || showNewPickupAddress || selectedPickupAddressId === null) && (
                        <div className="space-y-3 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                          <MapAddressSelector
                            onAddressSelect={handlePickupAddressSelect}
                            initialAddress={pickupAddress}
                            initialMapLink={pickupMapLink}
                            height="250px"
                          />
                          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={savePickupAddress}
                              onChange={(e) => setSavePickupAddress(e.target.checked)}
                              className="w-4 h-4 rounded text-green-600 focus:ring-green-500"
                            />
                            <span>Save for future orders</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Toggle */}
              <div className={`border rounded-xl p-5 transition-all ${deliveryEnabled ? 'border-blue-500 bg-blue-50/10' : 'border-gray-200 dark:border-gray-700'}`}>
                <label className="flex items-center justify-between cursor-pointer w-full">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${deliveryEnabled ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                      {deliveryEnabled && <FaPlus className="text-white rotate-45" size={10} />}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-gray-100 block">Delivery Service</span>
                      <span className="text-sm text-gray-500">We return your clean clothes (+₨ 200)</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={deliveryEnabled}
                    onChange={(e) => setDeliveryEnabled(e.target.checked)}
                    className="hidden"
                  />
                </label>

                {deliveryEnabled && (
                  <div className="mt-6 pl-2 sm:pl-8 space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <FaCalendar className="absolute left-3 top-3.5 text-gray-400" />
                        <input
                          type="date"
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="relative">
                        <FaClock className="absolute left-3 top-3.5 text-gray-400" />
                        <select
                          value={deliveryTime}
                          onChange={(e) => setDeliveryTime(e.target.value)}
                          className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                        >
                          <option value="">Select Time Slot</option>
                          {TIME_SLOTS.map(slot => (
                            <option key={slot.value} value={slot.value}>{slot.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Delivery Address</label>
                      <select
                        className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={selectedDeliveryAddressId || "new"}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleDeliveryAddressSelection(val === "new" ? null : parseInt(val));
                        }}
                        disabled={addressesLoading}
                      >
                        {deliveryAddresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>{addr.address}</option>
                        ))}
                        <option value="new">+ Add New Address</option>
                      </select>

                      {(deliveryAddresses.length === 0 || showNewDeliveryAddress || selectedDeliveryAddressId === null) && (
                        <div className="space-y-3 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                          <MapAddressSelector
                            onAddressSelect={handleDeliveryAddressSelect}
                            initialAddress={deliveryAddress}
                            initialMapLink={deliveryMapLink}
                            height="250px"
                          />
                          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={saveDeliveryAddress}
                              onChange={(e) => setSaveDeliveryAddress(e.target.checked)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span>Save for future orders</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Urgent Toggle */}
              <div className={`border rounded-xl p-5 transition-all ${isUrgent ? 'border-red-500 bg-red-50/10' : 'border-gray-200 dark:border-gray-700'}`}>
                <label className="flex items-center justify-between cursor-pointer w-full">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isUrgent ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                      {isUrgent && <FaPlus className="text-white rotate-45" size={10} />}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-gray-100 block">Urgent Service</span>
                      <span className="text-sm text-gray-500">Delivery within 24 hours (+₨ 500)</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Summary (Right Column) */}
        <div className="col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-gray-900 dark:text-gray-100">
              <FaShoppingCart className="text-blue-600" />
              Your Cart
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
                <FaShoppingCart className="mx-auto text-3xl text-gray-300 mb-2" />
                <p className="text-gray-400 font-medium">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {cart.map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex justify-between items-start group">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-100">{item.clothName}</h4>
                        <p className="text-xs text-gray-500 capitalize">
                          {item.washTypeName} • {item.material} • {item.clothType}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-600 shadow-sm">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-5 h-5 flex items-center justify-center hover:text-red-500"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-5 h-5 flex items-center justify-center hover:text-green-500"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-gray-100">₨ {item.price}</p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors mt-2 p-1"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>₨ {subtotal.toLocaleString()}</span>
                  </div>
                  {pickupEnabled && (
                    <div className="flex justify-between text-green-600">
                      <span>Pickup fee</span>
                      <span>+ ₨ {pickupCost}</span>
                    </div>
                  )}
                  {deliveryEnabled && (
                    <div className="flex justify-between text-blue-600">
                      <span>Delivery fee</span>
                      <span>+ ₨ {deliveryCost}</span>
                    </div>
                  )}
                  {isUrgent && (
                    <div className="flex justify-between text-red-600">
                      <span>Urgent fee</span>
                      <span>+ ₨ {urgentCost}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 pt-3 border-t border-gray-100 dark:border-gray-700 mt-2">
                    <span>Total</span>
                    <span>₨ {total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={proceedToCheckout}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
