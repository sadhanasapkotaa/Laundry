// API service functions for branch manager management

import api from '../queries/api'; // Use the axios instance with proper interceptors

// Types
export interface BranchManager {
  id: number;
  manager_id: string;
  user: number;
  user_email: string;
  user_name: string;
  branch: number;
  branch_name: string;
  salary: number;
  hired_date: string;
  leaving_date?: string;
  id_type: 'citizenship' | 'national_id' | 'drivers_licence';
  citizenship_number: string;
  is_active: boolean;
  created: string;
  modified: string;
  phone?: string;
}

export interface BranchManagerFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  branch: number;
  salary: number;
  hired_date: string;
  leaving_date?: string;
  id_type: 'citizenship' | 'national_id' | 'drivers_licence';
  citizenship_number: string;
  manager_id?: string;
}

export interface BranchManagerUpdateData {
  first_name: string;
  last_name: string;
  phone: string;
  branch: number;
  salary: number;
  hired_date: string;
  leaving_date?: string;
  id_type: 'citizenship' | 'national_id' | 'drivers_licence';
  citizenship_number: string;
  is_active: boolean;
}

// Branch Manager API functions
export const branchManagerAPI = {
  // Get all branch managers
  list: async (params?: {
    search?: string;
    branch?: string;
    is_active?: boolean;
    id_type?: string;
    ordering?: string;
  }): Promise<BranchManager[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.branch && params.branch !== 'all') queryParams.append('branch', params.branch);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.id_type && params.id_type !== 'all') queryParams.append('id_type', params.id_type);
    if (params?.ordering) queryParams.append('ordering', params.ordering);

    const endpoint = `/branch/branch-managers/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api.get(endpoint);
    return response.data;
  },

  // Create a new branch manager
  create: async (data: BranchManagerFormData): Promise<BranchManager> => {
    // Generate manager ID if not provided
    const managerData = {
      ...data,
      manager_id: data.manager_id || `MGR-${Date.now().toString().slice(-6)}`,
    };

    const response = await api.post('/branch/branch-managers/create/', managerData);
    return response.data;
  },

  // Get a specific branch manager
  detail: async (id: string | number): Promise<BranchManager> => {
    const response = await api.get(`/branch/branch-managers/${id}/`);
    return response.data;
  },

  // Update a branch manager
  update: async (id: string | number, data: Partial<BranchManagerUpdateData>): Promise<BranchManager> => {
    const response = await api.put(`/branch/branch-managers/${id}/update/`, data);
    return response.data;
  },

  // Delete a branch manager
  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/branch/branch-managers/${id}/delete/`);
  },
};
