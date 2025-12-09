// API service functions for order management

import api from '../queries/api';

// Types
export interface OrderItem {
  service_type: string;
  material: string;
  quantity: number;
  pricing_type: 'individual' | 'bulk';
  price_per_unit: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_id: string;
  customer_name?: string;
  branch: number;
  branch_name: string;
  services: OrderItem[];
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  pickup_requested?: boolean;
  pickup_date?: string;
  pickup_time?: string;
  pickup_address?: string;
  pickup_map_link?: string;
  delivery_date?: string;
  delivery_time?: string;
  delivery_address?: string;
  delivery_map_link?: string;
  is_urgent: boolean;
  total_amount: number;
  payment_method: 'cash' | 'bank' | 'esewa';
  payment_status: 'pending' | 'paid' | 'failed';
  status: 'pending pickup' | 'pending' | 'in progress' | 'to be delivered' | 'completed' | 'cancelled';
  created: string;
  order_date?: string;
  description?: string;
  delivery_contact?: string;
  esewa_reference?: string;
}

export interface CreateOrderRequest {
  branch: number;
  services: OrderItem[];
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  pickup_date?: string;
  pickup_time?: string;
  pickup_address?: string;
  pickup_map_link?: string;
  delivery_date?: string;
  delivery_time?: string;
  delivery_address?: string;
  delivery_map_link?: string;
  is_urgent: boolean;
  total_amount: number;
  payment_method: 'cash' | 'bank' | 'esewa';
  payment_status: 'pending' | 'paid';
  description?: string;
  delivery_contact?: string;
}

export interface UpdateOrderRequest {
  payment_status?: 'pending' | 'paid' | 'failed';
  status?: 'pending pickup' | 'pending' | 'in progress' | 'to be delivered' | 'completed' | 'cancelled';
  esewa_reference?: string;
  delivery_contact?: string;
}

export interface OrderStats {
  success: boolean;
  stats: {
    total_orders: number;
    active_orders: number;
    completed_orders: number;
    pending_payments_count: number;
    pending_amount: number;
  };
  pending_orders: Array<{
    id: string;
    order_id: string;
    total_amount: number;
    status: string;
    order_date: string;
  }>;
  branch_pending_amounts?: Array<{
    branch_name: string;
    branch_id: number;
    total_pending: number;
  }>;
}

// Order API functions
export const orderAPI = {
  // Create a new order
  create: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await api.post('/orders/create/', data);
    return response.data;
  },

  // Get all orders for the user
  list: async (params?: {
    search?: string;
    status?: string;
    payment_status?: string;
    payment_method?: string;
    ordering?: string;
  }): Promise<Order[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.payment_status && params.payment_status !== 'all') queryParams.append('payment_status', params.payment_status);
    if (params?.payment_method && params.payment_method !== 'all') queryParams.append('payment_method', params.payment_method);
    if (params?.ordering) queryParams.append('ordering', params.ordering);

    const endpoint = `/orders/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api.get(endpoint);
    return response.data.results || response.data;
  },

  // Get a specific order
  detail: async (id: string | number): Promise<Order> => {
    const response = await api.get(`/orders/${id}/`);
    return response.data;
  },

  // Update an order
  update: async (id: string | number, data: UpdateOrderRequest): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/update/`, data);
    return response.data;
  },

  // Delete an order
  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/orders/${id}/delete/`);
  },

  // Get order statistics (pending amount, active orders, etc.)
  getStats: async (): Promise<OrderStats> => {
    const response = await api.get('/orders/stats/');
    return response.data;
  },
};

export default orderAPI;