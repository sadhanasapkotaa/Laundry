// Payment components for handling different payment methods
"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { PaymentService, PaymentInitiateRequest } from '../services/paymentService';

interface PaymentMethodSelectorProps {
  onPaymentInitiated: (result: { success: boolean; error?: string; payment_type?: string }) => void;
  amount: number;
  orderId?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onPaymentInitiated,
  amount,
  orderId
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'bank' | 'esewa'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const paymentRequest: PaymentInitiateRequest = {
        payment_type: selectedMethod,
        amount,
        order_id: orderId,
      };

      const result = await PaymentService.initiatePayment(paymentRequest);

      if (result.success) {
        if (selectedMethod === 'esewa' && result.payment_data && result.esewa_url) {
          // Redirect to eSewa payment gateway
          PaymentService.submitEsewaPayment(result.payment_data, result.esewa_url);
        } else {
          // Handle other payment methods
          onPaymentInitiated(result);
        }
      } else {
        onPaymentInitiated(result);
      }
    } catch {
      onPaymentInitiated({
        success: false,
        error: 'Payment initiation failed',
        payment_type: selectedMethod,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
        <div className="space-y-3">
          {/* Cash on Delivery */}
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="payment_method"
              value="cash"
              checked={selectedMethod === 'cash'}
              onChange={(e) => setSelectedMethod(e.target.value as 'cash')}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="font-medium">Cash on Delivery</div>
              <div className="text-sm text-gray-500">Pay when your order is delivered</div>
            </div>
            <div className="text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </label>

          {/* Bank Transfer */}
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="payment_method"
              value="bank"
              checked={selectedMethod === 'bank'}
              onChange={(e) => setSelectedMethod(e.target.value as 'bank')}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="font-medium">Bank Transfer</div>
              <div className="text-sm text-gray-500">Transfer directly to our bank account</div>
            </div>
            <div className="text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </label>

          {/* eSewa */}
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="payment_method"
              value="esewa"
              checked={selectedMethod === 'esewa'}
              onChange={(e) => setSelectedMethod(e.target.value as 'esewa')}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="font-medium">eSewa</div>
              <div className="text-sm text-gray-500">Pay instantly with your eSewa wallet</div>
            </div>
            <div className="text-purple-600 relative w-8 h-8">
              <Image
                src="/esewa-logo.png"
                alt="eSewa"
                width={32}
                height={32}
                className="object-contain"
                onError={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.display = 'none';
                  const next = target.nextElementSibling as HTMLElement;
                  if (next) next.style.display = 'flex';
                }}
              />
              <div style={{ display: 'none' }} className="absolute inset-0 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">eS</div>
            </div>
          </label>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total Amount:</span>
          <span className="text-2xl font-bold text-green-600">Rs. {amount.toLocaleString()}</span>
        </div>

        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            `Pay with ${selectedMethod === 'cash' ? 'Cash on Delivery' : selectedMethod === 'bank' ? 'Bank Transfer' : 'eSewa'}`
          )}
        </button>
      </div>
    </div>
  );
};

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankDetails: {
    account_name: string;
    account_number: string;
    bank_name: string;
    swift_code: string;
  };
  transactionUuid: string;
}

export const BankDetailsModal: React.FC<BankDetailsModalProps> = ({
  isOpen,
  onClose,
  bankDetails,
  transactionUuid
}) => {
  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to show a toast notification here
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Bank Transfer Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              Please transfer the amount to the following bank account and keep the transaction receipt.
            </p>
            <p className="text-xs text-blue-600">
              Transaction ID: {transactionUuid}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="text-sm text-gray-600">Account Name</div>
                <div className="font-medium">{bankDetails.account_name}</div>
              </div>
              <button
                onClick={() => copyToClipboard(bankDetails.account_name)}
                className="text-blue-600 hover:text-blue-800"
              >
                Copy
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="text-sm text-gray-600">Account Number</div>
                <div className="font-medium font-mono">{bankDetails.account_number}</div>
              </div>
              <button
                onClick={() => copyToClipboard(bankDetails.account_number)}
                className="text-blue-600 hover:text-blue-800"
              >
                Copy
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="text-sm text-gray-600">Bank Name</div>
                <div className="font-medium">{bankDetails.bank_name}</div>
              </div>
              <button
                onClick={() => copyToClipboard(bankDetails.bank_name)}
                className="text-blue-600 hover:text-blue-800"
              >
                Copy
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="text-sm text-gray-600">SWIFT Code</div>
                <div className="font-medium font-mono">{bankDetails.swift_code}</div>
              </div>
              <button
                onClick={() => copyToClipboard(bankDetails.swift_code)}
                className="text-blue-600 hover:text-blue-800"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> After making the transfer, please contact our support team with your transaction receipt and the Transaction ID above.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
