// hooks/useSubscription.tsx
import { useState, useEffect } from 'react';

export interface Subscription {
  id: string;
  plan: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  payment_amount?: number;
  transaction_uuid: string;
  // Define specific properties instead of using any
}

interface SubscriptionStatusResponse {
  success: boolean;
  subscription?: Subscription;
  error?: string;
}

interface PaymentStatusResponse {
  success: boolean;
  status?: string;
  ref_id?: string;
  // Define specific properties instead of using any
}

export interface UseSubscriptionResult {
  subscription: Subscription | null;
  loading: boolean;
  error: string;
  refetch: () => void;
  checkPaymentStatus: (transactionUuid: string) => Promise<PaymentStatusResponse | null>;
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
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: SubscriptionStatusResponse = await response.json();

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

  const checkPaymentStatus = async (transactionUuid: string): Promise<PaymentStatusResponse | null> => {
    try {
      const response = await fetch(`http://localhost:8000/api/payments/status/${transactionUuid}/`);
      const data: PaymentStatusResponse = await response.json();

      if (data.success) {
        await fetchSubscriptionStatus(); // refresh subscription after payment
        return data;
      }
    } catch (err) {
      console.error('Payment status check error:', err);
    }
    return null;
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
