// API service functions for branch management

import api from '../queries/api'; // Use the axios instance with proper interceptors

// Types
export interface Branch {
  id: number;
  name: string;
  branch_id: string;
  address: string;
  city: string;
  map_link?: string;
  phone: string;
  email: string;
  branch_manager: string;
  status: 'active' | 'inactive';
  opening_date: string;
  created: string;
  modified: string;
  total_orders: number;
  monthly_revenue: number;
  monthly_expenses: number;
  staff_count: number;
}

// Paginated response type
export interface PaginatedBranchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Branch[];
}

export interface BranchFormData {
  name: string;
  address: string;
  city: string;
  map_link?: string;
  phone: string;
  email: string;
  branch_manager: string;
  status: 'active' | 'inactive';
  opening_date: string;
}

export interface BranchStats {
  id: number;
  name: string;
  branch_id: string;
  total_orders: number;
  monthly_revenue: number;
  monthly_expenses: number;
  staff_count: number;
  net_profit: number;
}

// Branch API functions
export const branchAPI = {
  // Get all branches
  list: async (params?: {
    search?: string;
    status?: string;
    city?: string;
    ordering?: string;
  }): Promise<Branch[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.city && params.city !== 'all') queryParams.append('city', params.city);
    if (params?.ordering) queryParams.append('ordering', params.ordering);

    const endpoint = `/branch/branches/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api.get<PaginatedBranchResponse>(endpoint);
    
    // Return the results array from the paginated response
    return response.data.results;
  },

  // Create a new branch
  create: async (data: BranchFormData): Promise<Branch> => {
    const response = await api.post('/branch/branches/create/', data);
    return response.data;
  },

  // Get a specific branch
  detail: async (id: string | number): Promise<Branch> => {
    const response = await api.get(`/branch/branches/${id}/`);
    return response.data;
  },

  // Update a branch
  update: async (id: string | number, data: Partial<BranchFormData>): Promise<Branch> => {
    const response = await api.put(`/branch/branches/${id}/update/`, data);
    return response.data;
  },

  // Delete a branch
  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/branch/branches/${id}/delete/`);
  },

  // Get branch statistics
  stats: async (id: string | number): Promise<BranchStats> => {
    const response = await api.get(`/branch/branches/${id}/stats/`);
    return response.data;
  },
};
