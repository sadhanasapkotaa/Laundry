"use client";

import React, { useState, useEffect } from "react";
import { FaCreditCard, FaHistory, FaChevronLeft, FaChevronRight, FaSpinner, FaRegCreditCard } from "react-icons/fa";
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

    const getStatusBadge = (status: string) => {
        const baseClass = "px-2.5 py-0.5 rounded-full text-xs font-semibold";
        const statusStyles: Record<string, string> = {
            'COMPLETE': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'PENDING': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            'FAILED': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'CANCELED': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        };
        return `${baseClass} ${statusStyles[status] || statusStyles['PENDING']}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-400">
                <FaSpinner className="h-8 w-8 animate-spin mb-4 text-blue-500" />
                <p>Loading payment details...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                    Payments
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Manage your balance and view transaction history
                </p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Payment Action */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Main Payment Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pending Balance</h2>
                                    <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-2">₨ {totalPendingAmount.toLocaleString()}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Across {pendingPaymentsCount} pending order{pendingPaymentsCount !== 1 && 's'}
                                    </p>
                                </div>
                                <div className="hidden md:block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-full">
                                    <FaRegCreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Branch Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Branch</label>
                                    <div className="relative">
                                        <select
                                            value={selectedBranch || ''}
                                            onChange={(e) => setSelectedBranch(Number(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                                        >
                                            <option value="" disabled>Select a branch</option>
                                            {branches.map(branch => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.name} ({branch.city})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                            <FaChevronRight className="rotate-90 w-3 h-3" />
                                        </div>
                                    </div>
                                    {selectedBranch && getSelectedBranchPendingAmount() > 0 && (
                                        <p className="text-xs text-gray-500 mt-2 ml-1">
                                            Pending at this branch: <span className="font-medium text-gray-900 dark:text-gray-100">Rs. {getSelectedBranchPendingAmount().toLocaleString()}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount to Pay</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500">₨</span>
                                        <input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (parseFloat(val) >= 0 || val === '') {
                                                    setPaymentAmount(val);
                                                    setError(null);
                                                }
                                            }}
                                            placeholder="0.00"
                                            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        />
                                    </div>
                                    {totalPendingAmount > 0 && (
                                        <div className="mt-2 text-right">
                                            <button
                                                onClick={() => setPaymentAmount(totalPendingAmount.toString())}
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                            >
                                                Pay Full Amount
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => {
                                        const amount = parseFloat(paymentAmount);
                                        if (!isNaN(amount)) handlePayment(amount);
                                        else setError('Please enter a valid amount');
                                    }}
                                    disabled={isProcessing || !paymentAmount || !selectedBranch || parseFloat(paymentAmount) <= 0}
                                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    {isProcessing ? <FaSpinner className="animate-spin" /> : <FaCreditCard />}
                                    Pay via eSewa
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Branch Breakdown (if needed) */}
                    {branchPendingAmounts && branchPendingAmounts.length > 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {branchPendingAmounts.filter(b => b.total_pending > 0).map(b => (
                                <div key={b.branch_id}
                                    onClick={() => {
                                        setSelectedBranch(b.branch_id);
                                        setPaymentAmount(b.total_pending.toString());
                                    }}
                                    className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                                >
                                    <div className="text-xs text-gray-500 uppercase tracking-widest">{b.branch_name}</div>
                                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1 group-hover:text-blue-600">₨ {b.total_pending.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Col: Recent Transactions */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-full max-h-[600px] flex flex-col">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <FaHistory className="text-gray-400" /> Recent History
                            </h3>
                        </div>

                        <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
                            {payments.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <p className="text-sm">No transactions yet</p>
                                </div>
                            ) : (
                                payments.slice(0, 5).map(payment => (
                                    <div key={payment.id} className="group p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {payment.payment_type === 'esewa' ? 'eSewa Payment' : 'Cash Payment'}
                                            </div>
                                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                ₨ {payment.total_amount.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="text-xs text-gray-500">
                                                {new Date(payment.created_at).toLocaleDateString()}
                                                <div className="mt-0.5 opacity-75">{payment.branch_name}</div>
                                            </div>
                                            <span className={getStatusBadge(payment.status)}>{payment.status}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 rounded-b-2xl">
                            <a href="/customer/payment-history" className="block w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                View Full History
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
