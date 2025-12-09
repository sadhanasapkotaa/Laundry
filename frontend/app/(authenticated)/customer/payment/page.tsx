"use client";

import React, { useState, useEffect } from "react";
import { FaCreditCard, FaWallet, FaHistory, FaChevronLeft, FaChevronRight, FaSpinner } from "react-icons/fa";
import { branchAPI, Branch } from "../../../services/branchService";
import { orderAPI, OrderStats } from "../../../services/orderService";
import { PaymentService, PaymentData } from "../../../services/paymentService";

export default function CustomerPaymentPage() {
    const [stats, setStats] = useState<OrderStats['stats'] | null>(null);
    const [pendingOrders, setPendingOrders] = useState<OrderStats['pending_orders']>([]);
    const [branchPendingAmounts, setBranchPendingAmounts] = useState<OrderStats['branch_pending_amounts']>([]);
    const [payments, setPayments] = useState<PaymentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Payment form state
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
    const [idempotencyKey, setIdempotencyKey] = useState<string>("");

    // Pagination for payment history
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    // Generate idempotency key on mount
    useEffect(() => {
        const generateIdempotencyKey = () => {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 15);
            return `payment-${timestamp}-${random}`;
        };
        setIdempotencyKey(generateIdempotencyKey());
    }, []);

    useEffect(() => {
        // Check if we're returning from a successful payment
        const paymentSuccess = localStorage.getItem('paymentSuccess');
        if (paymentSuccess === 'true') {
            localStorage.removeItem('paymentSuccess');
            console.log('[Payment Page] Detected successful payment, refreshing data...');
        }
        fetchData();
    }, [currentPage]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch stats from backend and payment history in parallel
            const [statsResponse, paymentsResponse, branchesResponse] = await Promise.all([
                orderAPI.getStats(),
                PaymentService.getPaymentHistory({ page: currentPage, page_size: pageSize }),
                branchAPI.list({ status: 'active' }),
            ]);

            setBranches(branchesResponse);
            if (branchesResponse.length > 0) {
                setSelectedBranch(branchesResponse[0].id);
            }

            if (statsResponse.success) {
                setStats(statsResponse.stats);
                setPendingOrders(statsResponse.pending_orders || []);
                setBranchPendingAmounts(statsResponse.branch_pending_amounts || []);
            }

            setPayments(paymentsResponse.payments || []);
            setTotalPages(paymentsResponse.pagination?.total_pages || 1);
            console.log('[Payment Page] Loaded payments:', paymentsResponse.payments?.length || 0, 'payments');
            if (paymentsResponse.payments && paymentsResponse.payments.length > 0) {
                console.log('[Payment Page] Sample payment:', paymentsResponse.payments[0]);
            }
        } catch (err) {
            console.error('Error fetching payment data:', err);
            setError('Failed to load payment data');
        } finally {
            setIsLoading(false);
        }
    };

    // Get pending amount from backend stats
    const totalPendingAmount = stats?.pending_amount || 0;
    const pendingPaymentsCount = stats?.pending_payments_count || 0;

    // Get branch-specific pending amount
    const getSelectedBranchPendingAmount = () => {
        if (!selectedBranch || !branchPendingAmounts) return 0;
        const branchData = branchPendingAmounts.find(b => b.branch_id === selectedBranch);
        return branchData?.total_pending || 0;
    };

    const handlePayment = async (amount: number) => {
        // Client-side validation
        if (amount <= 0) {
            setError('Amount must be greater than zero');
            return;
        }

        if (isNaN(amount)) {
            setError('Please enter a valid amount');
            return;
        }

        if (!selectedBranch) {
            setError('Please select a branch for payment');
            return;
        }

        const branchPendingAmount = getSelectedBranchPendingAmount();

        // Warn if amount exceeds branch-specific pending amount
        if (amount > branchPendingAmount && branchPendingAmount > 0) {
            if (!confirm(`The amount entered (Rs. ${amount}) is greater than the pending amount for this branch (Rs. ${branchPendingAmount}). Do you want to proceed?`)) {
                return;
            }
        }

        // Prevent overpayment beyond total pending
        if (amount > totalPendingAmount && totalPendingAmount > 0) {
            setError(`Amount cannot exceed total pending amount (Rs. ${totalPendingAmount})`);
            return;
        }

        try {
            setIsProcessing(true);
            setError(null);

            const response = await PaymentService.initiatePayment({
                payment_type: 'esewa',
                amount: amount,
                branch_id: selectedBranch,
                idempotency_key: idempotencyKey,
                payment_source: 'payment_page',  // Identify this as payment page
            });

            if (response.success && response.payment_data && response.esewa_url) {
                // Store return URL in localStorage
                localStorage.setItem('paymentReturnUrl', '/customer/payment');

                // Redirect to eSewa
                PaymentService.submitEsewaPayment(response.payment_data, response.esewa_url);
            } else {
                throw new Error(response.error || 'Failed to initiate payment');
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError(err instanceof Error ? err.message : 'Payment failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayAll = () => {
        handlePayment(totalPendingAmount);
    };

    const handlePayPartial = () => {
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        handlePayment(amount);
    };

    const getStatusBadge = (status: string) => {
        const statusStyles: Record<string, string> = {
            'COMPLETE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            'FAILED': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            'CANCELED': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
        };
        return statusStyles[status] || statusStyles['PENDING'];
    };

    const getPaymentTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'esewa': 'eSewa',
            'cash': 'Cash',
            'bank': 'Bank Transfer',
        };
        return labels[type] || type;
    };

    const getPaymentSourceLabel = (source?: string) => {
        if (source === 'order') return 'Order Placement';
        if (source === 'payment_page') return 'Post-Order Payment';
        return 'Payment';
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <FaWallet className="text-blue-600" />
                    Payment Portal
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage your pending payments and view payment history
                </p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Pending Amount Card */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-blue-100 text-sm">Total Pending Amount</p>
                        <p className="text-4xl font-bold mt-1">₨ {totalPendingAmount.toLocaleString()}</p>
                        <p className="text-blue-200 text-sm mt-2">{pendingPaymentsCount} order(s) pending payment</p>
                    </div>
                    <div className="p-4 bg-white/20 rounded-full">
                        <FaCreditCard className="h-10 w-10" />
                    </div>
                </div>

                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaWallet /> Make a Payment
                    </h3>

                    {/* Branch Selection */}
                    <div className="mb-4">
                        <label className="block text-sm text-blue-100 mb-1">Select Branch</label>
                        <select
                            value={selectedBranch || ''}
                            onChange={(e) => setSelectedBranch(Number(e.target.value))}
                            className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 [&>option]:text-gray-900"
                        >
                            <option value="" disabled>Select a branch</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name} ({branch.city})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount Input */}
                    <div className="mb-4">
                        <label className="block text-sm text-blue-100 mb-1">Payment Amount (Rs.)</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={paymentAmount}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Prevent negative values
                                if (parseFloat(value) < 0) {
                                    setError('Amount cannot be negative');
                                    return;
                                }
                                setPaymentAmount(value);
                                setError(null);
                            }}
                            placeholder="Enter amount to pay"
                            className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                        {selectedBranch && getSelectedBranchPendingAmount() > 0 && (
                            <p className="text-blue-100 text-xs mt-1">
                                Branch pending: Rs. {getSelectedBranchPendingAmount().toLocaleString()}
                            </p>
                        )}
                        {Number(paymentAmount) > totalPendingAmount && totalPendingAmount > 0 && (
                            <p className="text-yellow-300 text-xs mt-1">
                                ⚠️ Amount exceeds total pending balance (Rs. {totalPendingAmount.toLocaleString()})
                            </p>
                        )}
                    </div>

                    {/* Pay Button */}
                    <button
                        onClick={() => {
                            const amount = parseFloat(paymentAmount);
                            if (!isNaN(amount)) {
                                handlePayment(amount);
                            } else {
                                setError('Please enter a valid amount');
                            }
                        }}
                        disabled={isProcessing || !paymentAmount || !selectedBranch}
                        className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isProcessing ? (
                            <FaSpinner className="animate-spin" />
                        ) : (
                            <>
                                <FaCreditCard />
                                Pay via eSewa
                            </>
                        )}
                    </button>

                    {totalPendingAmount > 0 && (
                        <button
                            onClick={() => {
                                setPaymentAmount(totalPendingAmount.toString());
                            }}
                            className="w-full mt-3 py-2 text-sm text-blue-100 hover:text-white hover:bg-white/10 rounded transition-colors"
                        >
                            Pay Full Pending Amount (Rs. {totalPendingAmount})
                        </button>
                    )}
                </div>
            </div>

            {/* Branch-wise Pending Amount */}
            {branchPendingAmounts && branchPendingAmounts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {branchPendingAmounts.map((branchStats) => (
                        <div key={branchStats.branch_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{branchStats.branch_name}</h3>
                            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                ₨ {branchStats.total_pending.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Pending orders only
                            </p>
                            <button
                                onClick={() => {
                                    setSelectedBranch(branchStats.branch_id);
                                    setPaymentAmount(branchStats.total_pending.toString());
                                }}
                                className="text-sm text-blue-600 dark:text-blue-400 mt-2 hover:underline"
                            >
                                Pay this amount
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Explanation for users */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Payment Information
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                    The amounts shown above represent pending payments for orders at each branch. 
                    If you've made advance payments that aren't applied to specific orders, 
                    they will appear as credit in your payment history below.
                </p>
            </div>

            {/* Payment History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FaHistory className="text-gray-500" />
                        Payment History
                    </h2>
                </div>

                {payments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <FaHistory className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No payment history found</p>
                        <p className="text-sm mt-2">Your completed payments will appear here</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Method
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Branch
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                <div>
                                                    {new Date(payment.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                                                    {payment.transaction_uuid.substring(0, 12)}...
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                {payment.payment_source === 'order' ? (
                                                    <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded text-xs font-medium">
                                                        📦 Order Placement
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-medium">
                                                        💰 Post-Order
                                                    </span>
                                                )}
                                                {payment.orders_count && payment.orders_count > 0 && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                        {payment.orders_count} order{payment.orders_count > 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {getPaymentTypeLabel(payment.payment_type)}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {payment.branch_name || 'N/A'}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                <div>₨ {payment.total_amount.toLocaleString()}</div>
                                                {payment.is_advance_payment ? (
                                                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                                        Advance payment (no applicable orders)
                                                    </div>
                                                ) : payment.orders_count && payment.orders_count > 0 ? (
                                                    payment.excess_amount && payment.excess_amount > 0 ? (
                                                        <div className="text-xs mt-1 space-y-0.5">
                                                            <div className="text-green-600 dark:text-green-400">
                                                                Applied: ₨ {payment.amount_applied?.toLocaleString() ?? 0}
                                                            </div>
                                                            <div className="text-blue-600 dark:text-blue-400 font-medium">
                                                                Credit: ₨ {payment.excess_amount.toLocaleString()}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                            Fully applied to {payment.orders_count} order{payment.orders_count > 1 ? 's' : ''}
                                                        </div>
                                                    )
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(payment.status)}`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Page {currentPage} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        <FaChevronLeft className="h-3 w-3" />
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        Next
                                        <FaChevronRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
