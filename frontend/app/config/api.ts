// API configuration for the laundry management system

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/auth/login/',
      LOGOUT: '/auth/logout/',
      REGISTER: '/auth/register/',
      REFRESH: '/auth/token/refresh/',
      VERIFY: '/auth/verify-email/',
    },
    // Branch management
    BRANCHES: {
      LIST: '/branch/branches/',
      CREATE: '/branch/branches/create/',
      DETAIL: (id: string | number) => `/branch/branches/${id}/`,
      UPDATE: (id: string | number) => `/branch/branches/${id}/update/`,
      DELETE: (id: string | number) => `/branch/branches/${id}/delete/`,
      STATS: (id: string | number) => `/branch/branches/${id}/stats/`,
    },
    // Branch manager management
    BRANCH_MANAGERS: {
      LIST: '/branch/branch-managers/',
      CREATE: '/branch/branch-managers/create/',
      DETAIL: (id: string | number) => `/branch/branch-managers/${id}/`,
      UPDATE: (id: string | number) => `/branch/branch-managers/${id}/update/`,
      DELETE: (id: string | number) => `/branch/branch-managers/${id}/delete/`,
    },
    // Orders
    ORDERS: {
      LIST: '/orders/',
      CREATE: '/orders/create/',
      DETAIL: (id: string | number) => `/orders/${id}/`,
      UPDATE: (id: string | number) => `/orders/${id}/update/`,
      DELETE: (id: string | number) => `/orders/${id}/delete/`,
    },
    // Accounting
    ACCOUNTING: {
      INCOME: {
        LIST: '/account/income/',
        CREATE: '/account/income/create/',
        DETAIL: (id: string | number) => `/account/income/${id}/`,
        UPDATE: (id: string | number) => `/account/income/${id}/update/`,
        DELETE: (id: string | number) => `/account/income/${id}/delete/`,
      },
      EXPENSE: {
        LIST: '/account/expense/',
        CREATE: '/account/expense/create/',
        DETAIL: (id: string | number) => `/account/expense/${id}/`,
        UPDATE: (id: string | number) => `/account/expense/${id}/update/`,
        DELETE: (id: string | number) => `/account/expense/${id}/delete/`,
      },
    },
    // Payments
    PAYMENTS: {
      INITIATE: '/payments/initiate/',
      SUCCESS: '/payments/success/',
      FAILURE: '/payments/failure/',
      STATUS: (uuid: string) => `/payments/status/${uuid}/`,
      HISTORY: '/payments/history/',
      SUBSCRIPTION_STATUS: '/payments/subscription/status/',
    },
  },
};

// Helper function to get full URL
export const getFullUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('accessToken'); // Fixed: use 'accessToken' instead of 'access_token'
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function for API requests
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = getFullUrl(endpoint);
  const headers = getAuthHeaders();

  return fetch(url, {
    headers,
    ...options,
  });
};
