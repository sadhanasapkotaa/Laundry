// Payment service for handling different payment methods
import { API_CONFIG, apiRequest } from '../config/api';

export interface PaymentData {
  id: number;
  transaction_uuid: string;
  transaction_code?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  payment_type: 'cash' | 'bank' | 'esewa';
  status: 'PENDING' | 'COMPLETE' | 'FAILED' | 'CANCELED' | 'FULL_REFUND' | 'PARTIAL_REFUND' | 'NOT_FOUND';
  ref_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  payments: PaymentData[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface PaymentInitiateRequest {
  payment_type: 'cash' | 'bank' | 'esewa';
  amount: number;
  order_id?: string;
}

export interface EsewaPaymentData {
  amount: string;
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
}

export interface PaymentInitiateResponse {
  success: boolean;
  transaction_uuid: string;
  payment_type: 'cash' | 'bank' | 'esewa';
  payment_data?: EsewaPaymentData;
  esewa_url?: string;
  bank_details?: {
    account_name: string;
    account_number: string;
    bank_name: string;
    swift_code: string;
  };
  message?: string;
  error?: string;
}

export interface SubscriptionStatus {
  success: boolean;
  subscription?: {
    is_active: boolean;
    start_date: string;
    end_date: string;
    payment_amount: number;
  } | null;
}

export class PaymentService {
  /**
   * Initiate a payment with specified type and amount
   */
  static async initiatePayment(data: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.PAYMENTS.INITIATE, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Payment initiation error:', error);
      return {
        success: false,
        transaction_uuid: '',
        payment_type: data.payment_type,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get payment history with optional filters
   */
  static async getPaymentHistory(params: {
    search?: string;
    payment_type?: string;
    status?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<PaymentHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const endpoint = `${API_CONFIG.ENDPOINTS.PAYMENTS.HISTORY}?${queryParams.toString()}`;
      const response = await apiRequest(endpoint, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Payment history fetch error:', error);
      return {
        success: false,
        payments: [],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_count: 0,
          has_next: false,
          has_previous: false,
        },
      };
    }
  }

  /**
   * Check payment status
   */
  static async checkPaymentStatus(transactionUuid: string): Promise<any> {
    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.PAYMENTS.STATUS(transactionUuid), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Payment status check error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get user subscription status
   */
  static async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.PAYMENTS.SUBSCRIPTION_STATUS, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Subscription status fetch error:', error);
      return {
        success: false,
        subscription: null,
      };
    }
  }

  /**
   * Create eSewa payment form and submit
   */
  static submitEsewaPayment(paymentData: EsewaPaymentData, esewaUrl: string): void {
    // Create a form element
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = esewaUrl;
    form.style.display = 'none';

    // Add all payment data as hidden inputs
    Object.entries(paymentData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    // Append to body and submit
    document.body.appendChild(form);
    form.submit();
    
    // Clean up
    document.body.removeChild(form);
  }
}

export default PaymentService;
