"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCheckCircle, FaHome, FaClipboardList, FaDownload, FaCreditCard, FaClock } from "react-icons/fa";

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orderDetails] = useState({
    orderId: searchParams.get('orderId') || '',
    paymentMethod: searchParams.get('paymentMethod') || '',
    paymentRef: searchParams.get('paymentRef') || '',
    amount: searchParams.get('amount') || '',
  });

  useEffect(() => {
    // Clear any remaining order data from localStorage
    localStorage.removeItem('orderData');

    // If no order ID is provided, redirect to orders page
    if (!orderDetails.orderId) {
      router.push('/place-orders');
    }
  }, [orderDetails.orderId, router]);

  const getPaymentMethodInfo = () => {
    switch (orderDetails.paymentMethod) {
      case 'esewa':
        return {
          name: 'eSewa',
          icon: FaCreditCard,
          description: 'Payment completed via eSewa digital wallet',
          status: 'Paid',
          statusColor: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
        };
      case 'bank':
        return {
          name: 'Bank Transfer',
          icon: FaCreditCard,
          description: 'Please complete the bank transfer as instructed',
          status: 'Payment Pending',
          statusColor: 'text-orange-600',
          bgColor: 'bg-orange-50 border-orange-200',
        };
      case 'cod':
        return {
          name: 'Cash on Delivery',
          icon: FaCreditCard,
          description: 'Pay when your order is delivered',
          status: 'Payment on Delivery',
          statusColor: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200',
        };
      default:
        return {
          name: 'Unknown',
          icon: FaCreditCard,
          description: 'Payment method not specified',
          status: 'Unknown',
          statusColor: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200',
        };
    }
  };

  const paymentInfo = getPaymentMethodInfo();
  const PaymentIcon = paymentInfo.icon;

  const goToHome = () => {
    router.push('/dashboard');
  };

  const goToOrders = () => {
    router.push('/orders'); // Assuming there's an orders listing page
  };

  const printOrder = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Success Header */}
        <div className="bg-green-600 text-white p-6 text-center">
          <FaCheckCircle className="text-6xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-green-100">Your laundry order has been successfully placed.</p>
        </div>

        {/* Order Details */}
        <div className="p-6">
          {/* Order ID */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Order ID</h2>
            <div className="text-3xl font-mono font-bold text-blue-600 bg-blue-50 py-3 px-6 rounded-lg inline-block">
              #{orderDetails.orderId}
            </div>
          </div>

          {/* Payment Information */}
          <div className={`mb-6 p-4 border rounded-lg ${paymentInfo.bgColor}`}>
            <div className="flex items-center gap-3 mb-3">
              <PaymentIcon className={`text-xl ${paymentInfo.statusColor}`} />
              <h3 className="text-lg font-semibold text-gray-800">Payment Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium">{paymentInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${paymentInfo.statusColor}`}>{paymentInfo.status}</span>
              </div>
              {orderDetails.paymentRef && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-mono text-sm">{orderDetails.paymentRef}</span>
                </div>
              )}
              {orderDetails.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">Rs. {orderDetails.amount}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-3">{paymentInfo.description}</p>
          </div>

          {/* Next Steps */}
          <div className="mb-6 p-4 border rounded-lg bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <FaClock className="text-xl text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">What&apos;s Next?</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              {orderDetails.paymentMethod === 'esewa' && (
                <>
                  <p>• Your payment has been confirmed</p>
                  <p>• We&apos;ll contact you to confirm pickup/delivery details</p>
                  <p>• Your order will be processed within 24 hours</p>
                  <p>• You&apos;ll receive updates via SMS/email</p>
                </>
              )}
              {orderDetails.paymentMethod === 'bank' && (
                <>
                  <p>• Please complete the bank transfer as instructed</p>
                  <p>• Send payment confirmation to our WhatsApp/Email</p>
                  <p>• Order processing will begin after payment confirmation</p>
                  <p>• Expected processing time: 1-2 business days after payment</p>
                </>
              )}
              {orderDetails.paymentMethod === 'cod' && (
                <>
                  <p>• We&apos;ll contact you to confirm pickup/delivery details</p>
                  <p>• Your order will be processed within 24 hours</p>
                  <p>• Keep cash ready for payment on delivery</p>
                  <p>• You&apos;ll receive updates via SMS/email</p>
                </>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Need Help?</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Phone:</strong> +977-01-4567890</p>
              <p><strong>Email:</strong> support@laundryservice.com</p>
              <p><strong>WhatsApp:</strong> +977-9876543210</p>
              <p><strong>Hours:</strong> 7:00 AM - 8:00 PM (Daily)</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={goToHome}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <FaHome />
              Back to Home
            </button>

            <button
              onClick={goToOrders}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <FaClipboardList />
              View Orders
            </button>

            <button
              onClick={printOrder}
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <FaDownload />
              Print Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section,
          .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}