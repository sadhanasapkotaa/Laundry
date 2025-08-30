import { useState, useEffect } from 'react';

export interface Subscription {
  is_active: boolean;
  start_date: string;
  end_date: string;
  payment_amount: number;
  transaction_uuid: string;
  // Add more fields if your subscription has others
}

export interface UseSubscriptionResult {
  subscription: Subscription | null;
  loading: boolean;
  error: string;
  refetch: () => void;
  checkPaymentStatus: (transactionUuid: string) => Promise<void>;
}

const useSubscription = (): UseSubscriptionResult => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchSubscriptionStatus = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/payments/subscription/status/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.subscription) {
        setSubscription(data.subscription);
        setError('');
      } else {
        setSubscription(null);
        setError(data.error || 'Failed to fetch subscription status');
      }
    } catch (err) {
      setSubscription(null);
      setError('Network error');
      console.error('Subscription fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (transactionUuid: string): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:8000/api/payments/status/${transactionUuid}/`);
      const data = await response.json();

      if (data.success) {
        await fetchSubscriptionStatus();
      }
    } catch (err) {
      console.error('Payment status check error:', err);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscriptionStatus,
    checkPaymentStatus,
  };
};

export default useSubscription;
