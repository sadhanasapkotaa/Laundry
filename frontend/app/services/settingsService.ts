// API service for settings and pricing management

import api from '../queries/api';

// Types
export interface SystemSettings {
    id: number;
    pickup_cost: string;
    delivery_cost: string;
    urgent_cost: string;
    updated_at: string;
}

export interface WashType {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
}

export interface ClothName {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
}

export interface ClothType {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
}

export interface PricingRule {
    id: number;
    wash_type: number;
    cloth_name: number;
    cloth_type: number;
    price: string;
    is_active: boolean;
    wash_type_name?: string;
    cloth_name_name?: string;
    cloth_type_name?: string;
}

// Settings API
export const settingsAPI = {
    get: async (): Promise<SystemSettings> => {
        const response = await api.get('/services/settings/');
        return response.data;
    },
    update: async (data: Partial<SystemSettings>): Promise<SystemSettings> => {
        const response = await api.put('/services/settings/', data);
        return response.data;
    },
};

// Wash Type API
export const washTypeAPI = {
    list: async (): Promise<WashType[]> => {
        const response = await api.get('/services/wash-types/');
        return response.data.results || response.data;
    },
    create: async (data: Partial<WashType>): Promise<WashType> => {
        const response = await api.post('/services/wash-types/', data);
        return response.data;
    },
    update: async (id: number, data: Partial<WashType>): Promise<WashType> => {
        const response = await api.patch(`/services/wash-types/${id}/`, data);
        return response.data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/services/wash-types/${id}/`);
    },
};

// Cloth Name API
export const clothNameAPI = {
    list: async (): Promise<ClothName[]> => {
        const response = await api.get('/services/cloth-names/');
        return response.data.results || response.data;
    },
    create: async (data: Partial<ClothName>): Promise<ClothName> => {
        const response = await api.post('/services/cloth-names/', data);
        return response.data;
    },
    update: async (id: number, data: Partial<ClothName>): Promise<ClothName> => {
        const response = await api.patch(`/services/cloth-names/${id}/`, data);
        return response.data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/services/cloth-names/${id}/`);
    },
};

// Cloth Type API
export const clothTypeAPI = {
    list: async (): Promise<ClothType[]> => {
        const response = await api.get('/services/cloth-types/');
        return response.data.results || response.data;
    },
    create: async (data: Partial<ClothType>): Promise<ClothType> => {
        const response = await api.post('/services/cloth-types/', data);
        return response.data;
    },
    update: async (id: number, data: Partial<ClothType>): Promise<ClothType> => {
        const response = await api.patch(`/services/cloth-types/${id}/`, data);
        return response.data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/services/cloth-types/${id}/`);
    },
};

// Pricing Rule API
export const pricingRuleAPI = {
    list: async (): Promise<PricingRule[]> => {
        const response = await api.get('/services/pricing-rules/');
        return response.data.results || response.data;
    },
    create: async (data: Partial<PricingRule>): Promise<PricingRule> => {
        const response = await api.post('/services/pricing-rules/', data);
        return response.data;
    },
    update: async (id: number, data: Partial<PricingRule>): Promise<PricingRule> => {
        const response = await api.patch(`/services/pricing-rules/${id}/`, data);
        return response.data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/services/pricing-rules/${id}/`);
    },
    lookup: async (washType: number, clothName: number, clothType: number): Promise<{ price: string | null }> => {
        const response = await api.get('/services/pricing-rules/lookup/', {
            params: { wash_type: washType, cloth_name: clothName, cloth_type: clothType }
        });
        return response.data;
    },
};

export default { settingsAPI, washTypeAPI, clothNameAPI, clothTypeAPI, pricingRuleAPI };
