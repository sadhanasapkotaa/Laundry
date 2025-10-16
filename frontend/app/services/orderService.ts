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
  id: number;
  order_id: string;
  user: number;
  branch: number;
  branch_name: string;
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
  payment_status: 'pending' | 'paid' | 'unpaid' | 'failed';
  status: 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled';
  created: string;
  modified: string;
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
  payment_status: 'pending' | 'paid' | 'unpaid';
  status: 'pending';
  description?: string;
  delivery_contact?: string;
}

export interface UpdateOrderRequest {
  payment_status?: 'pending' | 'paid' | 'unpaid' | 'failed';
  status?: 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled';
  esewa_reference?: string;
  delivery_contact?: string;
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
};

export default orderAPI;