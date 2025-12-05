"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaCheckCircle, FaHome, FaListAlt } from "react-icons/fa";
import Link from "next/link";

function ConfirmationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const orderId = searchParams.get('orderId');
    const paymentMethod = searchParams.get('paymentMethod');
    const paymentRef = searchParams.get('paymentRef');
    const amount = searchParams.get('amount');

    const getPaymentMethodLabel = () => {
        switch (paymentMethod) {
            case 'esewa': return 'eSewa';
            case 'bank': return 'Bank Transfer';
            case 'cod': return 'Cash on Delivery';
            default: return paymentMethod;
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white shadow-lg rounded-lg p-8 text-center">
                <div className="mb-6">
                    <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-green-600 mb-2">Order Confirmed!</h1>
                    <p className="text-gray-600">Thank you for your order. We will process it shortly.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                    <h2 className="text-lg font-semibold mb-4">Order Details</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Order ID:</span>
                            <span className="font-medium">#{orderId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Payment Method:</span>
                            <span className="font-medium">{getPaymentMethodLabel()}</span>
                        </div>
                        {paymentRef && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Payment Reference:</span>
                                <span className="font-medium">{paymentRef}</span>
                            </div>
                        )}
                        {amount && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Amount Paid:</span>
                                <span className="font-medium text-green-600">Rs. {amount}</span>
                            </div>
                        )}
                    </div>
                </div>

                {paymentMethod === 'bank' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-semibold text-yellow-800 mb-2">Bank Transfer Instructions</h3>
                        <p className="text-sm text-yellow-700 mb-2">
                            Please transfer the amount to the following bank account:
                        </p>
                        <div className="text-sm text-yellow-800">
                            <p><strong>Bank:</strong> Sample Bank</p>
                            <p><strong>Account Name:</strong> Laundry Management System</p>
                            <p><strong>Account Number:</strong> 1234567890</p>
                            <p><strong>SWIFT:</strong> SAMPLEBNK</p>
                        </div>
                        <p className="text-sm text-yellow-700 mt-2">
                            Your order will be processed after payment confirmation.
                        </p>
                    </div>
                )}

                {paymentMethod === 'cod' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-semibold text-blue-800 mb-2">Cash on Delivery</h3>
                        <p className="text-sm text-blue-700">
                            Please keep the exact amount ready for payment upon delivery.
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/customer/orders"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        <FaListAlt />
                        View My Orders
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

export default function CustomerOrderConfirmationPage() {
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
            <ConfirmationContent />
        </Suspense>
    );
}
