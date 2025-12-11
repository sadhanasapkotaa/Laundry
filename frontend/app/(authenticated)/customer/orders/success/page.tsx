"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCheckCircle, FaSpinner, FaReceipt, FaArrowRight } from "react-icons/fa";
import { apiRequest, API_CONFIG } from "../../../../config/api";

export default function OrderPaymentSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 3;

    const [isLoading, setIsLoading] = useState(true);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchPaymentReceipt = async (attempt = 0) => {
            try {
                const transactionUuid = searchParams.get('transaction_uuid');
                const dataParam = searchParams.get('data');

                // Case 1: Handle eSewa direct return with data parameter
                if (dataParam) {
                    try {
                        const decoded = atob(dataParam);
                        const paymentData = JSON.parse(decoded);
                        console.log('Decoded eSewa data:', paymentData);

                        const { transaction_uuid, total_amount, transaction_code } = paymentData;

                        if (!transaction_uuid || !total_amount) {
                            throw new Error('Invalid payment data');
                        }

                        // Verify eSewa payment
                        const response = await apiRequest(API_CONFIG.ENDPOINTS.PAYMENTS.VERIFY_ESEWA, {
                            method: 'POST',
                            body: JSON.stringify({
                                transaction_uuid,
                                amount: total_amount,
                                transaction_code
                            }),
                        });

                        // Handle 503 specifically
                        if (response.status === 503 && attempt < MAX_RETRIES) {
                            console.log(`Verification returned 503, retrying (attempt ${attempt + 1}/${MAX_RETRIES})...`);
                            setTimeout(() => {
                                if (isMounted) fetchPaymentReceipt(attempt + 1);
                            }, 2000);
                            return;
                        }

                        const result = await response.json();

                        if (result.success) {
                            // If verification returns a full receipt (it should), use it
                            if (result.payment) {
                                if (isMounted) {
                                    setPaymentData(result.payment);
                                    setIsLoading(false);
                                }
                            } else {
                                // Fallback to fetching receipt if verify only returned success
                                const receiptResponse = await apiRequest(`/payments/process/${transaction_uuid}/`, {
                                    method: 'POST',
                                });
                                const receiptResult = await receiptResponse.json();
                                if (receiptResult.success) {
                                    if (isMounted) {
                                        setPaymentData(receiptResult.payment);
                                        setIsLoading(false);
                                    }
                                } else {
                                    if (isMounted) {
                                        setError(receiptResult.error || 'Failed to fetch payment details');
                                        setIsLoading(false);
                                    }
                                }
                            }
                        } else {
                            if (isMounted) {
                                setError(result.error || 'Payment verification failed');
                                setIsLoading(false);
                            }
                        }
                    } catch (e) {
                        console.error('Error processing eSewa data:', e);
                        if (isMounted) {
                            setError('Invalid payment data received from payment gateway');
                            setIsLoading(false);
                        }
                    }
                    return;
                }

                // Case 2: Handle existing flow with transaction_uuid
                if (!transactionUuid) {
                    if (isMounted) {
                        setError('No transaction ID found in URL. Please check if you were redirected properly from the payment gateway.');
                        setIsLoading(false);
                    }
                    return;
                }

                // Fetch payment receipt from backend
                const response = await apiRequest(`/payments/process/${transactionUuid}/`, {
                    method: 'POST',
                });

                if (response.status === 503 && attempt < MAX_RETRIES) {
                    console.log(`Receipt fetch returned 503, retrying (attempt ${attempt + 1}/${MAX_RETRIES})...`);
                    setTimeout(() => {
                        if (isMounted) fetchPaymentReceipt(attempt + 1);
                    }, 2000);
                    return;
                }

                const result = await response.json();

                if (result.success) {
                    if (isMounted) {
                        setPaymentData(result.payment);
                        setIsLoading(false);
                    }
                } else {
                    if (isMounted) {
                        setError(result.error || 'Failed to fetch payment details. Please try refreshing the page or contact support.');
                        setIsLoading(false);
                    }
                }
            } catch (err) {
                console.error('Error fetching payment receipt:', err);
                if (isMounted) {
                    setError('Failed to load payment details. Please try refreshing the page or contact support.');
                    setIsLoading(false);
                }
            }
        };

        fetchPaymentReceipt(0);

        return () => {
            isMounted = false;
        };
    }, [searchParams]);

    // Update isLoading handling to properly reflect retry state if needed, 
    // but the recursive calls are detached.
    // Let's refine the isLoading logic inside the function.
    // I will replace the function body entirely.


    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-600 dark:text-gray-400">Processing your payment...</p>
                </div>
            </div>
        );
    }

    if (error || !paymentData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Error Loading Payment
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/customer/orders')}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            View My Orders
                        </button>
                        <button
                            onClick={() => router.push('/customer/dashboard')}
                            className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Extract order from orders_paid array (should be the newly created order)
    const createdOrder = paymentData.orders_paid && paymentData.orders_paid.length > 0
        ? paymentData.orders_paid[0]
        : null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Success Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                        <FaCheckCircle className="text-3xl text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Payment Successful!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Your order has been placed and payment confirmed
                    </p>
                </div>

                {/* Payment Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FaReceipt className="text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Payment Receipt
                        </h2>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                            <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                {paymentData.transaction_uuid}
                            </span>
                        </div>
                        {paymentData.transaction_code && (
                            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">Reference Code:</span>
                                <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                    {paymentData.transaction_code}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                            <span className="text-gray-900 dark:text-gray-100 capitalize">
                                {paymentData.payment_type}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Branch:</span>
                            <span className="text-gray-900 dark:text-gray-100">
                                {paymentData.branch_name || 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                            <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                ₨ {paymentData.total_amount.toLocaleString()}
                            </span>
                        </div>
                        {createdOrder && (
                            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
                                <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                    {createdOrder.order_id}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => router.push('/customer/orders')}
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                        View My Orders
                        <FaArrowRight />
                    </button>
                    <button
                        onClick={() => router.push('/customer/dashboard')}
                        className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors font-medium"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}