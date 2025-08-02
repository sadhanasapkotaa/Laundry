import { useState } from 'react';
import useSubscription from '../hooks/useSubscription';
import PaymentForm from './PaymentForm';
import { UseSubscriptionResult } from '../hooks/useSubscription';

interface Subscription {
  is_active: boolean;
  start_date: string;
  end_date: string;
  payment_amount: number;
  transaction_uuid: string;
}

const SubscriptionDashboard = () => {
  const {
    subscription,
    loading,
    error,
    checkPaymentStatus,
  } = useSubscription() as UseSubscriptionResult;

  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);

  const handleCheckStatus = async (transactionUuid: string) => {
    setCheckingStatus(true);
    await checkPaymentStatus(transactionUuid);
    setCheckingStatus(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        Error: {error}
      </div>
    );
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isSubscriptionActive = subscription?.is_active;
  const isSubscriptionExpired =
    subscription && new Date(subscription.end_date) < new Date();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>

      {/* Current Subscription Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Status</h2>

        {isSubscriptionActive ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="text-green-500 text-2xl mr-3">✅</div>
              <div>
                <h3 className="text-lg font-medium text-green-800">Active Subscription</h3>
                <p className="text-green-600">You have access to all premium features</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <span className="text-gray-600">Start Date:</span>
                <p className="font-semibold">{formatDate(subscription.start_date)}</p>
              </div>
              <div>
                <span className="text-gray-600">End Date:</span>
                <p className="font-semibold">{formatDate(subscription.end_date)}</p>
              </div>
              <div>
                <span className="text-gray-600">Amount Paid:</span>
                <p className="font-semibold">Rs. {subscription.payment_amount}</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <p
                  className={`font-semibold ${
                    isSubscriptionExpired ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {isSubscriptionExpired ? 'Expired' : 'Active'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="text-yellow-500 text-2xl mr-3">⚠️</div>
              <div>
                <h3 className="text-lg font-medium text-yellow-800">No Active Subscription</h3>
                <p className="text-yellow-600">Subscribe to access premium features</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Features Comparison */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Features</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Free Features</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Basic functionality
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Limited usage
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Community support
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-blue-800 mb-3">Premium Features</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">★</span>
                Unlimited usage
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">★</span>
                Priority support
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">★</span>
                Advanced features
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">★</span>
                API access
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      {!isSubscriptionActive || isSubscriptionExpired ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {isSubscriptionExpired ? 'Renew Subscription' : 'Subscribe Now'}
          </h2>
          <PaymentForm />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Manage Subscription</h2>
          <p className="text-gray-600 mb-4">
            Your subscription is active and will auto-renew on{' '}
            {formatDate(subscription.end_date)}.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleCheckStatus(subscription.transaction_uuid)}
              disabled={checkingStatus}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
            >
              {checkingStatus ? 'Checking...' : 'Check Payment Status'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDashboard;


