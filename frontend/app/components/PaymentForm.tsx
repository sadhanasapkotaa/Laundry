import { useState } from 'react';
import Image from 'next/image';

const PaymentForm = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  interface PaymentInitiationResponse {
    success: boolean;
    esewa_url?: string;
    payment_data?: Record<string, string>;
    error?: string;
  }

  const initiatePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:8000/api/payments/initiate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: PaymentInitiationResponse = await response.json();

      if (data.success && data.esewa_url && data.payment_data) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.esewa_url;

        Object.entries(data.payment_data).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        setError(data.error || 'Failed to initiate payment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Payment initiation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Subscription Payment</h2>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Subscription Fee:</span>
          <span className="font-semibold">Rs. 5,000</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Tax:</span>
          <span className="font-semibold">Rs. 0</span>
        </div>
        <hr className="my-2" />
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total Amount:</span>
          <span className="text-green-600">Rs. 5,000</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        onClick={initiatePayment}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Initiating Payment...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Image 
              src="/esewa-logo.png" 
              alt="eSewa" 
              width={24}
              height={24}
              className="mr-2"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            Pay with eSewa
          </div>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        You will be redirected to eSewa to complete your payment securely.
      </p>
    </div>
  );
};

export default PaymentForm;
