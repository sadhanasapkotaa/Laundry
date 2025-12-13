// API service functions for delivery management

import api from '../queries/api';

// Types
export interface Delivery {
    id: number;
    order: string; // UUID from order
    delivery_address: string;
    delivery_contact: string;
    delivery_type: 'pickup' | 'drop';
    delivery_person?: number; // User Id of rider
    delivery_date: string;
    delivery_vehicle?: string;
    status: 'pending' | 'in_progress' | 'delivered' | 'cancelled';
    delivery_start_time?: string;
    delivery_end_time?: string;

    customer_name?: string;
    customer_phone?: string;
    order_total?: number;
    payment_status?: string;
    branch_name?: string; // New field
    map_link?: string;    // New field
    delivery_time: string; // Changed from enum to string to support "Early Morning" etc. literals or mapped values
}

export interface UpdateDeliveryRequest {
    status?: 'pending' | 'in_progress' | 'delivered' | 'cancelled';
    delivery_person?: number;
    delivery_start_time?: string;
    delivery_end_time?: string;
}

// Delivery API functions
export const deliveryAPI = {
    // Get all deliveries
    list: async (): Promise<Delivery[]> => {
        const response = await api.get('/orders/deliveries/');
        return response.data.results || response.data;
    },

    // Get a specific delivery
    detail: async (id: number): Promise<Delivery> => {
        const response = await api.get(`/orders/deliveries/${id}/`);
        return response.data;
    },

    // Update a delivery
    update: async (id: number, data: UpdateDeliveryRequest): Promise<Delivery> => {
        const response = await api.patch(`/orders/deliveries/${id}/update/`, data);
        return response.data;
    },

    // Delete a delivery
    delete: async (id: number): Promise<void> => {
        await api.delete(`/orders/deliveries/${id}/delete/`);
    },
};

export default deliveryAPI;
