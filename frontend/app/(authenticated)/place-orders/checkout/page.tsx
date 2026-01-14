"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaShoppingCart, FaMapMarkerAlt, FaClock, FaArrowLeft, FaCheck, FaSpinner } from "react-icons/fa";
import { orderAPI } from "../../../services/orderService";
import PaymentService from "../../../services/paymentService";
import { useAuth } from "../../../contexts/AuthContext";

interface OrderData {
  branch: number;
  branchInfo: {
    id: number;
    name: string;
    branch_id: string;
    city: string;
    address: string;
  };
  cart: Array<{
    id: string;
    clothName: string;
    material: string;
    quantity: number;
    clothType: "individual" | "bulk";
    price: number;
    unitPrice: number;
  }>;
  services: {
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    isUrgent: boolean;
  };
  pickup: {
    date: string;
    time: string;
    address: string;
    map_link: string;
  } | null;
  delivery: {
    date: string;
    time: string;
    address: string;
    map_link: string;
  } | null;
  pricing: {
    subtotal: number;
    pickupCost: number;
    deliveryCost: number;
    urgentCost: number;
    discount?: number; // Added discount
    total: number;
  };
  user: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<"esewa" | "bank" | "cod" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");

  useEffect(() => {
    // Check for eSewa payment return first (before loading order data)
    checkEsewaReturn();

    // Load order data from localStorage
    const storedOrderData = localStorage.getItem('orderData');
    if (storedOrderData) {
      try {
        const parsedData = JSON.parse(storedOrderData);
        setOrderData(parsedData);
      } catch (error) {
        console.error('Error parsing order data:', error);
        router.push('/place-orders');
      }
    } else {
      // No order data and no eSewa callback, redirect back to order page
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('data')) {
        router.push('/place-orders');
      }
    }
  }, [router]);

  const checkEsewaReturn = () => {
    const urlParams = new URLSearchParams(window.location.search);

    // Check for failure parameters first
    const failureReason = urlParams.get('failure_reason') || urlParams.get('error');

    if (failureReason) {
      // Payment failed
      router.push(`/place-orders/failure?reason=eSewa payment failed: ${failureReason}`);
      return;
    }

    // eSewa returns a base64-encoded 'data' parameter with payment info
    const dataParam = urlParams.get('data');

    if (dataParam) {
      try {
        // Decode base64 data
        const decodedData = atob(dataParam);
        const paymentData = JSON.parse(decodedData);

        console.log('eSewa payment callback data:', paymentData);

        // Extract values from the decoded data
        const {
          transaction_code,
          status,
          total_amount,
          transaction_uuid,
        } = paymentData;

        if (status === 'COMPLETE') {
          // Payment successful - use transaction_code as refId
          handleEsewaSuccess(transaction_uuid, transaction_code, parseFloat(total_amount));
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          // Payment not complete
          router.push(`/place-orders/failure?reason=eSewa payment status: ${status}`);
        }
      } catch (error) {
        console.error('Error parsing eSewa payment data:', error);
        router.push(`/place-orders/failure?reason=Failed to parse payment response`);
      }
    }
  };

  const handleEsewaSuccess = async (transactionUuid: string, transactionCode: string, amount: number) => {
    try {
      setIsProcessing(true);

      // First verify the payment with backend
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const verificationResponse = await fetch(`${API_BASE}/payments/verify-esewa/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_uuid: transactionUuid,
          transaction_code: transactionCode,
          amount: amount.toString(),
        }),
      });

      const verificationResult = await verificationResponse.json();

      if (!verificationResult.success) {
        throw new Error(verificationResult.error || 'Payment verification failed');
      }

      const storedOrderData = localStorage.getItem('orderData');
      if (!storedOrderData) {
        throw new Error('Order data not found');
      }

      const orderDataParsed = JSON.parse(storedOrderData);

      // Create order with paid status
      const order = await createOrder(orderDataParsed, 'esewa', 'paid', transactionCode);

      // Clear localStorage
      localStorage.removeItem('orderData');

      // Navigate to confirmation
      router.push(`/place-orders/confirmation?orderId=${order.id}&paymentMethod=esewa&paymentRef=${transactionCode}&amount=${amount}`);
    } catch (error) {
      console.error('Error processing eSewa success:', error);
      router.push(`/place-orders/failure?reason=Payment processing failed: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const createOrder = async (data: OrderData, paymentMethod: string, status: string, paymentRef?: string) => {
    try {
      // Prepare order data for API
      const orderRequest = {
        branch: data.branch,
        services: data.cart.map(item => ({
          service_type: item.clothName,
          material: item.material,
          quantity: item.quantity,
          pricing_type: item.clothType,
          price_per_unit: item.unitPrice,
          total_price: item.price,
        })),
        pickup_enabled: data.services.pickupEnabled,
        delivery_enabled: data.services.deliveryEnabled,
        pickup_date: data.pickup?.date || undefined,
        pickup_time: data.pickup?.time || undefined,
        pickup_address: data.pickup?.address || undefined,
        pickup_map_link: data.pickup?.map_link || undefined,
        delivery_date: data.delivery?.date || undefined,
        delivery_time: data.delivery?.time || undefined,
        delivery_address: data.delivery?.address || undefined,
        delivery_map_link: data.delivery?.map_link || undefined,
        is_urgent: data.services.isUrgent,
        total_amount: data.pricing.total,
        payment_method: paymentMethod as 'cash' | 'bank' | 'esewa',
        payment_status: status as 'pending' | 'paid' | 'unpaid',
        status: 'pending' as const,
        description: paymentRef ? `${orderNotes}${orderNotes ? ' | ' : ''}Payment Reference: ${paymentRef}` : orderNotes,
      };

      const response = await orderAPI.create(orderRequest);
      return response;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const handlePaymentSelection = async (method: "esewa" | "bank" | "cod") => {
    if (!orderData) return;

    setSelectedPayment(method);

    if (method === "esewa") {
      await handleEsewaPayment();
    } else if (method === "bank") {
      await handleBankPayment();
    } else if (method === "cod") {
      await handleCODPayment();
    }
  };

  const handleEsewaPayment = async () => {
    if (!orderData) return;

    try {
      setIsProcessing(true);

      const paymentResponse = await PaymentService.initiatePayment({
        payment_type: "esewa",
        amount: orderData.pricing.total,
        order_id: `ORDER-${Date.now()}`,
      });

      if (paymentResponse.success && paymentResponse.payment_data && paymentResponse.esewa_url) {
        // Store order data before redirect
        localStorage.setItem('orderData', JSON.stringify(orderData));

        // Redirect to eSewa
        PaymentService.submitEsewaPayment(paymentResponse.payment_data, paymentResponse.esewa_url);
      } else {
        throw new Error(paymentResponse.error || "Failed to initiate eSewa payment");
      }
    } catch (error) {
      console.error('eSewa payment error:', error);
      alert(`eSewa payment failed: ${error}`);
      setSelectedPayment(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBankPayment = async () => {
    if (!orderData) return;

    try {
      setIsProcessing(true);

      // Create order with pending payment status
      const order = await createOrder(orderData, 'bank', 'pending');

      // Clear localStorage
      localStorage.removeItem('orderData');

      // Show bank details and navigate to confirmation
      alert(`Order created successfully! Please transfer Rs. ${orderData.pricing.total} to our bank account:

Bank: Sample Bank
Account Name: Laundry Management System
Account Number: 1234567890
SWIFT: SAMPLEBNK

Your order will be processed after payment confirmation.
Order ID: ${order.id}`);

      router.push(`/place-orders/confirmation?orderId=${order.id}&paymentMethod=bank`);
    } catch (error) {
      console.error('Bank payment error:', error);
      alert(`Failed to create order: ${error}`);
      setSelectedPayment(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCODPayment = async () => {
    if (!orderData) return;

    try {
      setIsProcessing(true);

      // Create order with pending payment status
      const order = await createOrder(orderData, 'cod', 'pending');

      // Clear localStorage
      localStorage.removeItem('orderData');

      // Navigate to confirmation
      router.push(`/place-orders/confirmation?orderId=${order.id}&paymentMethod=cod`);
    } catch (error) {
      console.error('COD order error:', error);
      alert(`Failed to create order: ${error}`);
      setSelectedPayment(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const goBack = () => {
    router.push('/place-orders');
  };

  if (!orderData) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl mx-auto mb-4 text-blue-500" />
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded p-6">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={goBack}
                className="text-gray-600 hover:text-gray-800"
                disabled={isProcessing}
              >
                <FaArrowLeft />
              </button>
              <h1 className="text-2xl font-bold">Checkout</h1>
            </div>

            {/* Branch Info */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FaMapMarkerAlt className="text-blue-500" />
                Selected Branch
              </h2>
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium">{orderData.branchInfo.name}</h3>
                <p className="text-sm text-gray-600">ID: {orderData.branchInfo.branch_id}</p>
                <p className="text-sm text-gray-600">{orderData.branchInfo.address}, {orderData.branchInfo.city}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FaShoppingCart className="text-blue-500" />
                Order Items ({orderData.cart.length})
              </h2>
              <div className="space-y-3">
                {orderData.cart.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.clothName}</h4>
                      <p className="text-sm text-gray-600">Material: {item.material}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.clothType === "individual" ? "pieces" : "kg"} × Rs. {item.unitPrice}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">Rs. {item.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Details */}
            {(orderData.services.pickupEnabled || orderData.services.deliveryEnabled || orderData.services.isUrgent) && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FaClock className="text-blue-500" />
                  Services
                </h2>
                <div className="space-y-3">
                  {orderData.services.pickupEnabled && orderData.pickup && (
                    <div className="border rounded-lg p-4 bg-green-50">
                      <h4 className="font-medium text-green-800">Pickup Service</h4>
                      <p className="text-sm text-green-700">
                        Date: {orderData.pickup.date} at {orderData.pickup.time}
                      </p>
                      <p className="text-sm text-green-700">Address: {orderData.pickup.address}</p>
                      <p className="text-sm text-green-700">Cost: Rs. {orderData.pricing.pickupCost}</p>
                    </div>
                  )}

                  {orderData.services.deliveryEnabled && orderData.delivery && (
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h4 className="font-medium text-blue-800">Delivery Service</h4>
                      <p className="text-sm text-blue-700">
                        Date: {orderData.delivery.date} at {orderData.delivery.time}
                      </p>
                      <p className="text-sm text-blue-700">Address: {orderData.delivery.address}</p>
                      <p className="text-sm text-blue-700">Cost: Rs. {orderData.pricing.deliveryCost}</p>
                    </div>
                  )}

                  {orderData.services.isUrgent && (
                    <div className="border rounded-lg p-4 bg-orange-50">
                      <h4 className="font-medium text-orange-800">Urgent Service</h4>
                      <p className="text-sm text-orange-700">Delivered within 24 hours</p>
                      <p className="text-sm text-orange-700">Cost: Rs. {orderData.pricing.urgentCost}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Notes */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Special Instructions (Optional)</h2>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Any special instructions for your order..."
                className="w-full border rounded-lg p-3 h-24 resize-none"
                disabled={isProcessing}
              />
            </div>
          </div>
        </div>

        {/* Payment Summary & Methods */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded p-6 sticky top-6">
            {/* Price Breakdown */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rs. {orderData.pricing.subtotal}</span>
                </div>
                {orderData.pricing.pickupCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Pickup Service:</span>
                    <span>Rs. {orderData.pricing.pickupCost}</span>
                  </div>
                )}
                {orderData.pricing.deliveryCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Delivery Service:</span>
                    <span>Rs. {orderData.pricing.deliveryCost}</span>
                  </div>
                )}
                {orderData.pricing.urgentCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Urgent Service:</span>
                    <span>Rs. {orderData.pricing.urgentCost}</span>
                  </div>
                )}
                {orderData.pricing.discount && orderData.pricing.discount > 0 ? (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Discount:</span>
                    <span>- Rs. {orderData.pricing.discount}</span>
                  </div>
                ) : null}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>Rs. {orderData.pricing.total}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>

              {/* Information about payment */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>eSewa:</strong> Instant payment via eSewa digital wallet.
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Bank Transfer:</strong> Order will be processed after payment confirmation.
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Cash on Delivery:</strong> Pay when your order is delivered.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handlePaymentSelection("esewa")}
                  disabled={isProcessing}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${selectedPayment === "esewa"
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">eSewa</div>
                      <div className="text-sm text-gray-600">Pay instantly with eSewa</div>
                    </div>
                    {selectedPayment === "esewa" && isProcessing && (
                      <FaSpinner className="animate-spin text-purple-500" />
                    )}
                    {selectedPayment === "esewa" && !isProcessing && (
                      <FaCheck className="text-purple-500" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentSelection("bank")}
                  disabled={isProcessing}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${selectedPayment === "bank"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-sm text-gray-600">Transfer to our bank account</div>
                    </div>
                    {selectedPayment === "bank" && isProcessing && (
                      <FaSpinner className="animate-spin text-blue-500" />
                    )}
                    {selectedPayment === "bank" && !isProcessing && (
                      <FaCheck className="text-blue-500" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentSelection("cod")}
                  disabled={isProcessing}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${selectedPayment === "cod"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-green-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Cash on Delivery</div>
                      <div className="text-sm text-gray-600">Pay when order is delivered</div>
                    </div>
                    {selectedPayment === "cod" && isProcessing && (
                      <FaSpinner className="animate-spin text-green-500" />
                    )}
                    {selectedPayment === "cod" && !isProcessing && (
                      <FaCheck className="text-green-500" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {isProcessing && (
              <div className="text-center py-4">
                <FaSpinner className="animate-spin text-2xl mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-gray-600">Processing your order...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}