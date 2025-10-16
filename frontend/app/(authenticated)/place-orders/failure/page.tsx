"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaTimesCircle, FaHome, FaRedo, FaPhone, FaExclamationTriangle } from "react-icons/fa";

export default function FailurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [failureDetails, setFailureDetails] = useState({
    reason: searchParams.get('reason') || 'Unknown error occurred',
    orderId: searchParams.get('orderId') || '',
    errorCode: searchParams.get('errorCode') || '',
  });

  useEffect(() => {
    // If no failure reason is provided, set a default message
    if (!searchParams.get('reason')) {
      setFailureDetails(prev => ({
        ...prev,
        reason: 'Payment was cancelled or an unknown error occurred'
      }));
    }
  }, [searchParams]);

  const getFailureInfo = () => {
    const reason = failureDetails.reason.toLowerCase();
    
    if (reason.includes('payment') || reason.includes('esewa')) {
      return {
        title: 'Payment Failed',
        icon: FaTimesCircle,
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50 border-red-200',
        suggestions: [
          'Check your eSewa balance and try again',
          'Verify your payment credentials',
          'Try using a different payment method',
          'Contact eSewa support if the issue persists'
        ]
      };
    } else if (reason.includes('network') || reason.includes('connection')) {
      return {
        title: 'Connection Error',
        icon: FaExclamationTriangle,
        iconColor: 'text-orange-500',
        bgColor: 'bg-orange-50 border-orange-200',
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again',
          'Contact support if the problem continues'
        ]
      };
    } else {
      return {
        title: 'Order Failed',
        icon: FaTimesCircle,
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50 border-red-200',
        suggestions: [
          'Please try placing your order again',
          'Check all required fields are filled correctly',
          'Try using a different payment method',
          'Contact our support team for assistance'
        ]
      };
    }
  };

  const failureInfo = getFailureInfo();
  const FailureIcon = failureInfo.icon;

  const goToHome = () => {
    router.push('/dashboard');
  };

  const tryAgain = () => {
    // Clear any stored order data and go back to place orders
    localStorage.removeItem('orderData');
    router.push('/place-orders');
  };

  const contactSupport = () => {
    // This could open a support modal, redirect to a contact page, or open a phone dialer
    window.open('tel:+977-01-4567890', '_self');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Failure Header */}
        <div className="bg-red-600 text-white p-6 text-center">
          <FailureIcon className={`text-6xl mx-auto mb-4 ${failureInfo.iconColor} bg-white rounded-full p-3`} />
          <h1 className="text-3xl font-bold mb-2">{failureInfo.title}</h1>
          <p className="text-red-100">We're sorry, but something went wrong with your order.</p>
        </div>

        {/* Error Details */}
        <div className="p-6">
          {/* Error Information */}
          <div className={`mb-6 p-4 border rounded-lg ${failureInfo.bgColor}`}>
            <div className="flex items-center gap-3 mb-3">
              <FaExclamationTriangle className="text-xl text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800">What Happened?</h3>
            </div>
            <p className="text-gray-700 mb-3">{failureDetails.reason}</p>
            
            {failureDetails.orderId && (
              <div className="text-sm">
                <span className="text-gray-600">Order Reference: </span>
                <span className="font-mono font-medium">{failureDetails.orderId}</span>
              </div>
            )}
            
            {failureDetails.errorCode && (
              <div className="text-sm">
                <span className="text-gray-600">Error Code: </span>
                <span className="font-mono font-medium">{failureDetails.errorCode}</span>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="mb-6 p-4 border rounded-lg bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <FaRedo className="text-xl text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">What Can You Do?</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              {failureInfo.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Need Immediate Help?</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Phone:</strong> +977-01-4567890</p>
              <p><strong>Email:</strong> support@laundryservice.com</p>
              <p><strong>WhatsApp:</strong> +977-9876543210</p>
              <p><strong>Hours:</strong> 7:00 AM - 8:00 PM (Daily)</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Please mention the error details when contacting support for faster assistance.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={tryAgain}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <FaRedo />
              Try Again
            </button>
            
            <button
              onClick={contactSupport}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <FaPhone />
              Call Support
            </button>
            
            <button
              onClick={goToHome}
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <FaHome />
              Back to Home
            </button>
          </div>

          {/* Additional Help */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-yellow-600 mt-1" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Don't Worry!</h4>
                <p className="text-sm text-yellow-700">
                  No charges have been made to your account. Your order data is safe, and you can try placing the order again when ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}