"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaShoppingCart, FaMapMarkerAlt, FaArrowLeft, FaCheck, FaSpinner, FaMoneyBillWave, FaCreditCard, FaUniversity } from "react-icons/fa";
import { orderAPI } from "../../../../services/orderService";
import PaymentService from "../../../../services/paymentService";

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
        total: number;
    };
    user: number;
}

export default function CustomerCheckoutPage() {
    const router = useRouter();

    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<"esewa" | "bank" | "cod" | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderNotes, setOrderNotes] = useState("");

    const handleEsewaSuccess = useCallback(async (transactionUuid: string, transactionCode: string, amount: number) => {
        try {
            setIsProcessing(true);
            const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
            const accessToken = localStorage.getItem('accessToken');

            const verificationResponse = await fetch(`${API_BASE}/payments/verify-esewa/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
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

            localStorage.removeItem('customerOrderData');
            const encodedTransactionUuid = encodeURIComponent(transactionUuid);
            router.push(`/customer/orders/success?transaction_uuid=${encodedTransactionUuid}`);
        } catch (error) {
            console.error('Error processing eSewa success:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            router.push(`/customer/orders/failure?reason=Payment processing failed: ${encodeURIComponent(errorMessage)}`);
        } finally {
            setIsProcessing(false);
        }
    }, [router]);

    const checkEsewaReturn = useCallback(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const failureReason = urlParams.get('failure_reason') || urlParams.get('error');

        if (failureReason) {
            router.push(`/customer/place-order/failure?reason=eSewa payment failed: ${failureReason}`);
            return;
        }

        const dataParam = urlParams.get('data');

        if (dataParam) {
            try {
                const decodedData = atob(dataParam);
                const paymentData = JSON.parse(decodedData);
                const { transaction_code, status, total_amount, transaction_uuid } = paymentData;

                if (status === 'COMPLETE') {
                    handleEsewaSuccess(transaction_uuid, transaction_code, parseFloat(total_amount));
                    window.history.replaceState({}, document.title, window.location.pathname);
                } else {
                    router.push(`/customer/place-order/failure?reason=eSewa payment status: ${status}`);
                }
            } catch (error) {
                console.error('Error parsing eSewa payment data:', error);
                router.push(`/customer/place-order/failure?reason=Failed to parse payment response`);
            }
        }
    }, [handleEsewaSuccess, router]);

    useEffect(() => {
        // Check for eSewa payment return FIRST (before checking localStorage)
        const urlParams = new URLSearchParams(window.location.search);
        const dataParam = urlParams.get('data');
        const failureReason = urlParams.get('failure_reason') || urlParams.get('error');

        if (dataParam || failureReason) {
            checkEsewaReturn();
            return;
        }

        // Load order data from localStorage
        const storedOrderData = localStorage.getItem('customerOrderData');
        if (storedOrderData) {
            try {
                const parsedData = JSON.parse(storedOrderData);
                setOrderData(parsedData);
            } catch (error) {
                console.error('Error parsing order data:', error);
                router.push('/customer/place-order');
            }
        } else {
            router.push('/customer/place-order');
        }
    }, [router, checkEsewaReturn]);

    const createOrder = async (data: OrderData, paymentMethod: string, status: string, paymentRef?: string) => {
        try {
            const backendPaymentMethod = paymentMethod === 'cod' ? 'cash' : paymentMethod;

            const orderRequest = {
                branch: data.branch,
                services: data.cart.map(item => ({
                    service_type: item.clothName,
                    wash_type: item.washTypeName, // Include wash type
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
                payment_method: backendPaymentMethod as 'cash' | 'bank' | 'esewa',
                payment_status: status as 'pending' | 'paid',
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

        if (method === "esewa") await handleEsewaPayment();
        else if (method === "bank") await handleBankPayment();
        else if (method === "cod") await handleCODPayment();
    };

    const handleEsewaPayment = async () => {
        if (!orderData) return;

        try {
            setIsProcessing(true);
            // Construct the order object as expected by the backend
            const orderPayload = {
                branch: orderData.branch,
                services: orderData.cart.map(item => ({
                    service_type: item.clothName,
                    wash_type: item.washTypeName,
                    material: item.material,
                    quantity: item.quantity,
                    pricing_type: item.clothType,
                    price_per_unit: item.unitPrice,
                    total_price: item.price,
                })),
                pickup_enabled: orderData.services.pickupEnabled,
                delivery_enabled: orderData.services.deliveryEnabled,
                pickup_date: orderData.pickup?.date,
                pickup_time: orderData.pickup?.time,
                pickup_address: orderData.pickup?.address,
                pickup_map_link: orderData.pickup?.map_link,
                delivery_date: orderData.delivery?.date,
                delivery_time: orderData.delivery?.time,
                delivery_address: orderData.delivery?.address,
                delivery_map_link: orderData.delivery?.map_link,
                is_urgent: orderData.services.isUrgent,
                total_amount: orderData.pricing.total,
                payment_method: 'esewa',
                description: orderNotes,
            };

            const paymentResponse = await PaymentService.initiatePayment({
                payment_type: "esewa",
                amount: orderData.pricing.total,
                branch_id: orderData.branch,
                payment_source: 'order',
                order_data: orderPayload, // Use the constructed payload
            });

            if (paymentResponse.success && paymentResponse.payment_data && paymentResponse.esewa_url) {
                localStorage.setItem('customerOrderData', JSON.stringify(orderData));
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
            await createOrder(orderData, 'bank', 'pending');
            localStorage.removeItem('customerOrderData');

            // Custom simplified logic for demo/MVP - typically would redirect to a specific success/instruction page
            // Navigate to success page but with 'bank' context or handle differently
            // For now we will route to success and perhaps show instructions there or a specific confirmation page
            // Since we don't have a transaction_uuid for bank immediately, we might need a different success page or reuse existing.
            // Let's reuse success page but we need a valid transaction_uuid usually.
            // For Bank/COD, the success page logic (fetching by UUID) might fail if it strictly expects UUID.
            // We should check the Success page logic.
            // Assuming success page expects transaction_uuid, we might need to adjust.
            // Just alerting for now as per previous logic, but cleaner.
            router.push(`/customer/orders`); // Redirect to orders list
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
            await createOrder(orderData, 'cod', 'pending');
            localStorage.removeItem('customerOrderData');
            router.push(`/customer/orders`); // Redirect to orders list
        } catch (error) {
            console.error('COD order error:', error);
            alert(`Failed to create order: ${error}`);
            setSelectedPayment(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const goBack = () => {
        router.push('/customer/place-order');
    };

    if (!orderData) {
        return (
            <div className="flex h-[50vh] items-center justify-center text-gray-500">
                <FaSpinner className="animate-spin text-3xl mr-3" />
                <span className="text-lg">Preparing checkout...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-fadeIn">
            <button
                onClick={goBack}
                className="group flex items-center text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
                disabled={isProcessing}
            >
                <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 mr-2 transition-colors">
                    <FaArrowLeft size={14} />
                </div>
                <span className="font-medium">Back to Order Customization</span>
            </button>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Checkout & Payment</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Details (Left) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Branch & Services Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-blue-500" />
                            Service Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Selected Branch</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{orderData.branchInfo.name}</p>
                                <p className="text-sm text-gray-500">{orderData.branchInfo.city}</p>
                            </div>

                            {orderData.services.pickupEnabled && orderData.pickup && (
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                        Pickup <span className="text-green-500 text-[10px] bg-green-50 px-1.5 py-0.5 rounded-full">Active</span>
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{orderData.pickup.date} • {orderData.pickup.time}</p>
                                    <p className="text-sm text-gray-500 truncate" title={orderData.pickup.address}>{orderData.pickup.address}</p>
                                </div>
                            )}

                            {orderData.services.deliveryEnabled && orderData.delivery && (
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                        Delivery <span className="text-blue-500 text-[10px] bg-blue-50 px-1.5 py-0.5 rounded-full">Active</span>
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{orderData.delivery.date} • {orderData.delivery.time}</p>
                                    <p className="text-sm text-gray-500 truncate" title={orderData.delivery.address}>{orderData.delivery.address}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <FaShoppingCart className="text-purple-500" />
                            Items ({orderData.cart.length})
                        </h2>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {orderData.cart.map((item) => (
                                <div key={item.id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                                            <span className="font-bold text-sm">{item.quantity}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{item.clothName}</p>
                                            <p className="text-xs text-gray-500 capitalize">{item.washTypeName} • {item.material} • {item.clothType}</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-gray-900 dark:text-gray-100">₨ {item.price}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <label className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 block">Special Instructions</label>
                        <textarea
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                            placeholder="Add notes for pickup, delivery, or specific washing instructions..."
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 h-24 resize-none outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                            disabled={isProcessing}
                        />
                    </div>
                </div>

                {/* Right Column: Payment & Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Payment Method</h2>

                        <div className="space-y-3 mb-8">
                            <button
                                onClick={() => handlePaymentSelection("esewa")}
                                disabled={isProcessing}
                                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${selectedPayment === "esewa"
                                    ? "border-green-500 bg-green-50/20"
                                    : "border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-900"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                                        <FaCreditCard />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100">eSewa</p>
                                        <p className="text-xs text-gray-500">Instant digital payment</p>
                                    </div>
                                </div>
                                {selectedPayment === "esewa" && (isProcessing ? <FaSpinner className="animate-spin text-green-500" /> : <FaCheck className="text-green-500" />)}
                            </button>

                            <button
                                onClick={() => handlePaymentSelection("cod")}
                                disabled={isProcessing}
                                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${selectedPayment === "cod"
                                    ? "border-blue-500 bg-blue-50/20"
                                    : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-900"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                        <FaMoneyBillWave />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100">Cash on Delivery</p>
                                        <p className="text-xs text-gray-500">Pay upon service</p>
                                    </div>
                                </div>
                                {selectedPayment === "cod" && (isProcessing ? <FaSpinner className="animate-spin text-blue-500" /> : <FaCheck className="text-blue-500" />)}
                            </button>
                            <button
                                onClick={() => handlePaymentSelection("bank")}
                                disabled={isProcessing}
                                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${selectedPayment === "bank"
                                    ? "border-purple-500 bg-purple-50/20"
                                    : "border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-900"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                                        <FaUniversity />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100">Bank Transfer</p>
                                        <p className="text-xs text-gray-500">Manual verification</p>
                                    </div>
                                </div>
                                {selectedPayment === "bank" && (isProcessing ? <FaSpinner className="animate-spin text-purple-500" /> : <FaCheck className="text-purple-500" />)}
                            </button>
                        </div>

                        <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between text-gray-500 text-sm">
                                <span>Subtotal</span>
                                <span>₨ {orderData.pricing.subtotal.toLocaleString()}</span>
                            </div>
                            {orderData.pricing.pickupCost > 0 && (
                                <div className="flex justify-between text-green-600 text-sm">
                                    <span>Pickup fee</span>
                                    <span>+ ₨ {orderData.pricing.pickupCost}</span>
                                </div>
                            )}
                            {orderData.pricing.deliveryCost > 0 && (
                                <div className="flex justify-between text-blue-600 text-sm">
                                    <span>Delivery fee</span>
                                    <span>+ ₨ {orderData.pricing.deliveryCost}</span>
                                </div>
                            )}
                            {orderData.pricing.urgentCost > 0 && (
                                <div className="flex justify-between text-red-600 text-sm">
                                    <span>Urgent fee</span>
                                    <span>+ ₨ {orderData.pricing.urgentCost}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-gray-100 pt-2">
                                <span>Total</span>
                                <span>₨ {orderData.pricing.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
