export type UserRole = 'admin' | 'branch_manager' | 'accountant' | 'rider' | 'customer';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface RolePermissions {
  [key: string]: string[];
}

// Define all available permissions
export const PERMISSIONS: Permission[] = [
  // User Management
  { id: 'user_management_full', name: 'Full User Management', description: 'Create, edit, delete all users', category: 'User Management' },
  { id: 'user_management_profile', name: 'Profile Management', description: 'Edit own profile only', category: 'User Management' },

  // Service Management
  { id: 'service_management_full', name: 'Full Service Management', description: 'Manage all services and pricing', category: 'Service Management' },
  { id: 'service_management_read', name: 'Read Service Information', description: 'View service details only', category: 'Service Management' },

  // Order Management
  { id: 'order_management_full', name: 'Full Order Management', description: 'Manage all orders across branches', category: 'Order Management' },
  { id: 'order_management_branch', name: 'Branch Order Management', description: 'Manage orders for own branch', category: 'Order Management' },
  { id: 'order_management_delivery', name: 'Delivery Order Management', description: 'Manage delivery orders only', category: 'Order Management' },
  { id: 'order_management_own', name: 'Own Orders', description: 'View and manage own orders only', category: 'Order Management' },

  // Branch Management
  { id: 'branch_management_full', name: 'Full Branch Management', description: 'Manage all branches', category: 'Branch Management' },
  { id: 'branch_management_own', name: 'Own Branch Management', description: 'Manage own branch only', category: 'Branch Management' },

  // Payments
  { id: 'payments_full', name: 'Full Payment Management', description: 'Manage all payments and transactions', category: 'Payments' },
  { id: 'payments_own', name: 'Own Payments', description: 'View own payment history only', category: 'Payments' },

  // Accounting
  { id: 'accounting_full', name: 'Full Accounting Access', description: 'Access all financial data', category: 'Accounting' },
  { id: 'accounting_branch', name: 'Branch Accounting', description: 'Access financial data for own branch', category: 'Accounting' },
];

// Define role permissions based on your matrix
export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    'user_management_full',
    'service_management_full',
    'order_management_full',
    'branch_management_full',
    'payments_full',
    'accounting_full'
  ],
  branch_manager: [
    'service_management_full',
    'order_management_branch',
    'branch_management_own',
    'accounting_branch'
  ],
  accountant: [
    'accounting_full',
    'payments_full',
    'service_management_read',
    'order_management_full' // For viewing orders for accounting purposes
  ],
  rider: [
    'order_management_delivery'
  ],
  customer: [
    'user_management_profile',
    'service_management_read',
    'order_management_own',
    'payments_own'
  ]
};

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (userRole: UserRole, permissionId: string): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permissionId);
};

/**
 * Check if a user has any of the specified permissions
 */
export const hasAnyPermission = (userRole: UserRole, permissionIds: string[]): boolean => {
  return permissionIds.some(permissionId => hasPermission(userRole, permissionId));
};

/**
 * Check if a user has all of the specified permissions
 */
export const hasAllPermissions = (userRole: UserRole, permissionIds: string[]): boolean => {
  return permissionIds.every(permissionId => hasPermission(userRole, permissionId));
};

/**
 * Get all permissions for a specific role
 */
export const getRolePermissions = (userRole: UserRole): string[] => {
  return ROLE_PERMISSIONS[userRole] || [];
};

/**
 * Check if user can access a specific feature
 */
export const canAccess = {
  userManagement: (userRole: UserRole) => hasPermission(userRole, 'user_management_full'),
  serviceManagement: (userRole: UserRole) => hasAnyPermission(userRole, ['service_management_full', 'service_management_read']),
  orderManagement: (userRole: UserRole) => hasAnyPermission(userRole, ['order_management_full', 'order_management_branch', 'order_management_delivery', 'order_management_own']),
  branchManagement: (userRole: UserRole) => hasAnyPermission(userRole, ['branch_management_full', 'branch_management_own']),
  payments: (userRole: UserRole) => hasAnyPermission(userRole, ['payments_full', 'payments_own']),
  accounting: (userRole: UserRole) => hasAnyPermission(userRole, ['accounting_full', 'accounting_branch']),

  // Feature-specific access levels
  createOrders: (userRole: UserRole) => hasAnyPermission(userRole, ['order_management_full', 'order_management_branch']),
  editAllOrders: (userRole: UserRole) => hasPermission(userRole, 'order_management_full'),
  viewAllOrders: (userRole: UserRole) => hasAnyPermission(userRole, ['order_management_full', 'order_management_branch']),
  manageDeliveries: (userRole: UserRole) => hasAnyPermission(userRole, ['order_management_full', 'order_management_delivery']),

  createBranches: (userRole: UserRole) => hasPermission(userRole, 'branch_management_full'),
  editOwnBranch: (userRole: UserRole) => hasAnyPermission(userRole, ['branch_management_full', 'branch_management_own']),

  viewAllPayments: (userRole: UserRole) => hasPermission(userRole, 'payments_full'),
  viewOwnPayments: (userRole: UserRole) => hasAnyPermission(userRole, ['payments_full', 'payments_own']),

  viewFinancialReports: (userRole: UserRole) => hasAnyPermission(userRole, ['accounting_full', 'accounting_branch']),
  exportFinancialData: (userRole: UserRole) => hasPermission(userRole, 'accounting_full'),
};

/**
 * Get user-friendly role name
 */
export const getRoleName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    admin: 'Administrator',
    branch_manager: 'Branch Manager',
    accountant: 'Accountant',
    rider: 'Delivery Rider',
    customer: 'Customer'
  };
  return roleNames[role] || role;
};

/**
 * Get role color for UI display
 */
export const getRoleColor = (role: UserRole): string => {
  const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-800',
    branch_manager: 'bg-blue-100 text-blue-800',
    accountant: 'bg-purple-100 text-purple-800',
    rider: 'bg-green-100 text-green-800',
    customer: 'bg-gray-100 text-gray-800'
  };
  return roleColors[role] || 'bg-gray-100 text-gray-800';
};

/**
 * Page-specific permission mappings
 */
export const PAGE_PERMISSIONS = {
  '/dashboard': ['order_management_full', 'order_management_branch', 'order_management_delivery', 'order_management_own'],
  '/branches': ['branch_management_full'],
  '/branches/add': ['branch_management_full'],
  '/clients': ['user_management_full', 'order_management_branch'],
  '/orders': ['order_management_full', 'order_management_branch'],
  '/place-orders': ['order_management_full', 'order_management_branch'],
  '/payments': ['payments_full', 'payments_own'],
  '/expenses': ['accounting_full', 'accounting_branch'],
  '/income': ['accounting_full', 'accounting_branch'],
  '/incomes': ['accounting_full', 'accounting_branch'],
  '/delivery': ['order_management_delivery', 'order_management_full'],
  '/backup-export': ['accounting_full'],
  '/roles': ['user_management_full']
} as const;

/**
 * Get required permissions for a page
 */
export const getPagePermissions = (path: string): string[] => {
  // Remove query parameters and trailing slashes
  const cleanPath = path.split('?')[0].replace(/\/$/, '');

  // Check for exact match first
  if (PAGE_PERMISSIONS[cleanPath as keyof typeof PAGE_PERMISSIONS]) {
    return [...PAGE_PERMISSIONS[cleanPath as keyof typeof PAGE_PERMISSIONS]];
  }

  // Check for partial matches (e.g., /branches/123 should match /branches)
  for (const [route, permissions] of Object.entries(PAGE_PERMISSIONS)) {
    if (cleanPath.startsWith(route)) {
      return [...permissions];
    }
  }

  return ['user_management_profile']; // Default permission that all users have
};

/**
 * Check if user can access a specific page
 */
export const canAccessPage = (role: UserRole, path: string): boolean => {
  const requiredPermissions = getPagePermissions(path);
  return hasAnyPermission(role, requiredPermissions);
};
