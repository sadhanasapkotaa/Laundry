// pages/payment/failure.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const PaymentFailure = () => {
  const router = useRouter();

  useEffect(() => {
    // Notify backend about the failed payment
    const notifyFailure = async () => {
      const { transaction_uuid } = router.query;
      
      if (transaction_uuid) {
        try {
          await fetch(`http://localhost:8000/api/payments/failure/?transaction_uuid=${transaction_uuid}`);
        } catch (err) {
          console.error('Failed to notify payment failure:', err);
        }
      }
    };

    if (router.isReady) {
      notifyFailure();
    }
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-red-500 text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h1>
        
        <p className="text-gray-600 mb-6">
          Your payment could not be processed. This might be due to:
        </p>

        <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Payment was cancelled by you</li>
            <li>• Insufficient balance in your eSewa account</li>
            <li>• Network connection issues</li>
            <li>• Session timeout</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link 
            href="/payment" 
            className="block w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Payment Again
          </Link>
          <Link 
            href="/support" 
            className="block w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
          >
            Contact Support
          </Link>
          <Link 
            href="/dashboard" 
            className="block w-full text-gray-500 hover:text-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;