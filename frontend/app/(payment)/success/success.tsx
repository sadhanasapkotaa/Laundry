// pages/payment/success.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const PaymentSuccess = () => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const { data } = router.query;
      
      if (!data) {
        setError('No payment data received');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/payments/success/?data=${encodeURIComponent(data)}`);
        const result = await response.json();

        if (result.success) {
          setPaymentData(result.payment);
        } else {
          setError(result.error || 'Payment verification failed');
        }
      } catch (err) {
        setError('Failed to verify payment');
        console.error('Payment verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      handlePaymentSuccess();
    }
  }, [router.isReady, router.query]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/payment" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        
        {paymentData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold mb-2">Payment Details:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono">{paymentData.transaction_uuid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">eSewa Code:</span>
                <span className="font-mono">{paymentData.transaction_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold">Rs. {paymentData.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-semibold">{paymentData.status}</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          Your subscription has been activated successfully. You now have access to all premium features.
        </p>

        <div className="space-y-3">
          <Link 
            href="/dashboard" 
            className="block w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Go to Dashboard
          </Link>
          <Link 
            href="/subscription" 
            className="block w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
          >
            View Subscription Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;