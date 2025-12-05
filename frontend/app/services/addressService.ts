// API service functions for user address management

import api from '../queries/api';

// Types matching backend UserAddress model
export interface UserAddress {
    id: number;
    address: string;
    map_link: string | null;
    address_type: 'pickup' | 'delivery' | 'both';
    is_default: boolean;
}

export interface CreateAddressRequest {
    address: string;
    map_link?: string;
    address_type: 'pickup' | 'delivery' | 'both';
    is_default?: boolean;
}

export interface UpdateAddressRequest {
    address?: string;
    map_link?: string;
    address_type?: 'pickup' | 'delivery' | 'both';
    is_default?: boolean;
}

// Address API functions
export const addressAPI = {
    // Get all saved addresses for current user
    list: async (): Promise<UserAddress[]> => {
        const response = await api.get('/orders/addresses/');
        return response.data.results || response.data;
    },

    // Get addresses by type (pickup, delivery, or both)
    listByType: async (type: 'pickup' | 'delivery'): Promise<UserAddress[]> => {
        const allAddresses = await addressAPI.list();
        return allAddresses.filter(
            addr => addr.address_type === type || addr.address_type === 'both'
        );
    },

    // Create a new address
    create: async (data: CreateAddressRequest): Promise<UserAddress> => {
        const response = await api.post('/orders/addresses/', data);
        return response.data;
    },

    // Update an existing address
    update: async (id: number, data: UpdateAddressRequest): Promise<UserAddress> => {
        const response = await api.patch(`/orders/addresses/${id}/`, data);
        return response.data;
    },

    // Delete an address
    delete: async (id: number): Promise<void> => {
        await api.delete(`/orders/addresses/${id}/`);
    },

    // Set an address as default
    setDefault: async (id: number): Promise<UserAddress> => {
        const response = await api.patch(`/orders/addresses/${id}/`, { is_default: true });
        return response.data;
    },
};

export default addressAPI;
