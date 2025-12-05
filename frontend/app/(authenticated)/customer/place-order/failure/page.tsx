"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FaTimesCircle, FaRedo, FaHome } from "react-icons/fa";
import Link from "next/link";

function FailureContent() {
    const searchParams = useSearchParams();

    const reason = searchParams.get('reason') || 'An unknown error occurred';
    const orderId = searchParams.get('orderId');

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white shadow-lg rounded-lg p-8 text-center">
                <div className="mb-6">
                    <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-red-600 mb-2">Order Failed</h1>
                    <p className="text-gray-600">We could not process your order. Please try again.</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 text-left">
                    <h2 className="text-lg font-semibold text-red-800 mb-2">Error Details</h2>
                    <p className="text-red-700">{reason}</p>
                    {orderId && (
                        <p className="text-red-700 mt-2">
                            <strong>Order ID:</strong> {orderId}
                        </p>
                    )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-semibold text-gray-800 mb-2">What can you do?</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>Check your internet connection and try again</li>
                        <li>Ensure your payment method has sufficient balance</li>
                        <li>Try a different payment method</li>
                        <li>Contact our support team if the problem persists</li>
                    </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/customer/place-order"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        <FaRedo />
                        Try Again
                    </Link>
                    <Link
                        href="/customer/dashboard"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
                    >
                        <FaHome />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function CustomerOrderFailurePage() {
    return (
        <Suspense fallback={
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-white shadow-lg rounded-lg p-8 text-center">
                    <div className="animate-pulse">
                        <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    </div>
                </div>
            </div>
        }>
            <FailureContent />
        </Suspense>
    );
}
