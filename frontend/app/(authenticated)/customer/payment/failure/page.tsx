"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaTimesCircle, FaArrowLeft, FaRedo } from "react-icons/fa";

export default function PaymentFailurePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reason = searchParams?.get('reason') || searchParams?.get('error') || 'Payment was cancelled or failed';

    useEffect(() => {
        // Clear any payment return URL
        localStorage.removeItem('paymentReturnUrl');
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                {/* Error Icon */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                        <FaTimesCircle className="text-3xl text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Payment Failed
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {reason}
                    </p>
                </div>

                {/* Information */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-800 dark:text-yellow-400">
                        <strong>Don&apos;t worry!</strong> No charges were made to your account. You can try making the payment again.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/customer/payment')}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                        <FaRedo />
                        Try Again
                    </button>
                    <button
                        onClick={() => router.push('/customer/dashboard')}
                        className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                        <FaArrowLeft />
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
