"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCheckCircle, FaReceipt, FaDownload, FaPrint } from "react-icons/fa";
import { PaymentService } from "../../../../services/paymentService";
import { apiRequest, API_CONFIG } from "../../../../config/api";

interface OrderPaid {
    order_id: string;
    amount_applied: number;
    order_total: number;
    status: string;
}

interface PaymentReceipt {
    transaction_uuid: string;
    transaction_code?: string;
    status: string;
    total_amount: number;
    payment_type: string;
    branch_name?: string;
    created_at: string;
    processed_at?: string;
    orders_paid: OrderPaid[];
}

export default function PaymentSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Prevent duplicate verification requests
    const verificationAttempted = useRef(false);
    const verificationInProgress = useRef(false);

    useEffect(() => {
        // Prevent duplicate calls
        if (verificationAttempted.current || verificationInProgress.current) {
            console.log('[Payment Success] Verification already attempted or in progress, skipping');
            return;
        }

        const verifyPayment = async () => {
            // Double-check to prevent race conditions
            if (verificationInProgress.current) {
                console.log('[Payment Success] Verification already in progress');
                return;
            }

            verificationInProgress.current = true;
            verificationAttempted.current = true;

            try {
                console.log('[Payment Success] Starting payment verification');
                const allParams = Object.fromEntries(searchParams?.entries() || []);
                console.log('[Payment Success] URL parameters:', allParams);

                // Check if eSewa sent base64 encoded data
                const dataParam = searchParams?.get('data');

                let transactionUuid, amount, refId;

                if (dataParam) {
                    // New eSewa format: base64 encoded data
                    console.log('[Payment Success] Found base64 data parameter');
                    try {
                        const decoded = atob(dataParam);
                        const paymentData = JSON.parse(decoded);
                        console.log('[Payment Success] Decoded payment data:', paymentData);

                        transactionUuid = paymentData.transaction_uuid;
                        amount = paymentData.total_amount;
                        refId = paymentData.transaction_code || paymentData.refId;
                    } catch (decodeError) {
                        console.error('[Payment Success] Error decoding data parameter:', decodeError);
                        setError('Invalid payment data format');
                        setIsLoading(false);
                        return;
                    }
                } else {
                    // Old eSewa format: individual query parameters
                    console.log('[Payment Success] Using query parameters');
                    transactionUuid = searchParams?.get('transaction_uuid') || searchParams?.get('oid');
                    amount = searchParams?.get('amount') || searchParams?.get('amt');
                    refId = searchParams?.get('transaction_code') || searchParams?.get('refId');
                }

                console.log('[Payment Success] Extracted values:', { transactionUuid, amount, refId });

                if (!transactionUuid || !amount) {
                    console.error('[Payment Success] Missing required parameters');
                    console.error('[Payment Success] Available params:', allParams);
                    setError(`Invalid payment parameters - missing ${!transactionUuid ? 'transaction ID' : 'amount'}. Please check browser console for details.`);
                    setIsLoading(false);
                    return;
                }

                console.log('[Payment Success] Calling verify API with:', {
                    transaction_uuid: transactionUuid,
                    amount,
                    transaction_code: refId
                });

                // Verify payment with backend
                const response = await apiRequest(API_CONFIG.ENDPOINTS.PAYMENTS.VERIFY_ESEWA, {
                    method: 'POST',
                    body: JSON.stringify({
                        transaction_uuid: transactionUuid,
                        amount: amount,
                        transaction_code: refId,
                    }),
                });

                const data = await response.json();
                console.log('[Payment Success] Verify API response:', data);

                if (data.success && data.payment) {
                    console.log('[Payment Success] Verification successful');
                    setReceipt(data.payment);
                    // Set flag to refresh payment page when user navigates back
                    localStorage.setItem('paymentSuccess', 'true');
                } else {
                    console.error('[Payment Success] Verification failed:', data.error);
                    setError(data.error || 'Payment verification failed');
                }
            } catch (err) {
                console.error('[Payment Success] Payment verification error:', err);
                setError(`Failed to verify payment: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                setIsLoading(false);
                verificationInProgress.current = false;
            }
        };

        verifyPayment();
    }, [searchParams]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // Create a simple text receipt
        if (!receipt) return;

        const receiptText = `
PAYMENT RECEIPT
================

Transaction ID: ${receipt.transaction_uuid}
Transaction Code: ${receipt.transaction_code || 'N/A'}
Payment Type: ${receipt.payment_type.toUpperCase()}
Branch: ${receipt.branch_name || 'N/A'}
Amount Paid: Rs. ${receipt.total_amount.toLocaleString()}
Status: ${receipt.status}
Date: ${new Date(receipt.created_at).toLocaleString()}

ORDERS PAID:
${receipt.orders_paid.map((order, idx) => `
${idx + 1}. Order ID: ${order.order_id}
   Amount Applied: Rs. ${order.amount_applied.toLocaleString()}
   Order Total: Rs. ${order.order_total.toLocaleString()}
   Status: ${order.status}
`).join('\n')}

Thank you for your payment!
        `.trim();

        const blob = new Blob([receiptText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${receipt.transaction_uuid}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Verifying payment...</p>
                </div>
            </div>
        );
    }

    if (error || !receipt) {
        // Check if this is a database locking error where payment was likely successful
        const isDatabaseLockError = error?.toLowerCase().includes('database is locked') ||
            error?.toLowerCase().includes('database is temporarily busy');

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="text-center">
                        {isDatabaseLockError ? (
                            <>
                                <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    Payment Processing
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Your payment is being processed. This may take a moment due to high server load.
                                </p>
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
                                    <p className="text-sm text-blue-800 dark:text-blue-400">
                                        <strong>Good News:</strong><br />
                                        Your payment was likely successful! The system is currently updating your orders.<br /><br />
                                        <strong>What to do:</strong><br />
                                        1. Wait a few seconds and refresh this page<br />
                                        2. Or check your payment history to confirm<br />
                                        3. Your orders should show updated payment status
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Refresh Page
                                    </button>
                                    <button
                                        onClick={() => router.push('/customer/payment')}
                                        className="flex-1 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        View Payments
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-red-500 text-5xl mb-4">✕</div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    Payment Verification Failed
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    {error || 'Unable to verify payment'}
                                </p>
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 text-left">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-400">
                                        <strong>Troubleshooting:</strong><br />
                                        1. Check the browser console (F12) for detailed error logs<br />
                                        2. Ensure you were redirected from eSewa<br />
                                        3. Contact support if the issue persists
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/customer/payment')}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Back to Payment
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-3xl mx-auto">
                {/* Success Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6 text-center">
                    <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Payment Successful!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Your payment has been processed successfully
                    </p>
                </div>

                {/* Receipt */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 print:shadow-none">
                    <div className="flex items-center justify-between mb-6 print:mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <FaReceipt />
                            Payment Receipt
                        </h2>
                        <div className="flex gap-2 print:hidden">
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                <FaPrint /> Print
                            </button>
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <FaDownload /> Download
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        {/* Payment Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Transaction ID</p>
                                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {receipt.transaction_uuid}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Transaction Code</p>
                                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {receipt.transaction_code || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {receipt.payment_type.toUpperCase()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Branch</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {receipt.branch_name || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Date & Time</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {new Date(receipt.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-semibold">
                                    {receipt.status}
                                </span>
                            </div>
                        </div>

                        {/* Amount Paid */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount Paid</p>
                            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                ₨ {receipt.total_amount.toLocaleString()}
                            </p>
                        </div>

                        {/* Orders Paid */}
                        {receipt.orders_paid && receipt.orders_paid.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                    Orders Paid
                                </h3>
                                <div className="space-y-3">
                                    {receipt.orders_paid.map((order, idx) => (
                                        <div
                                            key={order.order_id}
                                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Order #{idx + 1}
                                                    </p>
                                                    <p className="font-mono text-xs text-gray-600 dark:text-gray-400">
                                                        {order.order_id}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${order.status === 'paid'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Amount Applied</p>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                        ₨ {order.amount_applied.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Order Total</p>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                        ₨ {order.order_total.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-4 justify-center print:hidden">
                    <button
                        onClick={() => router.push('/customer/payment')}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Back to Payments
                    </button>
                    <button
                        onClick={() => router.push('/customer/dashboard')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
