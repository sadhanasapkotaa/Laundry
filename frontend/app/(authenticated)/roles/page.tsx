"use client";

import "../../types/i18n";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  FaUserShield, 
  FaUsers, 
  FaCog, 
  FaCheck, 
  FaTimes, 
  FaEdit,
  FaPlus,
  FaSearch,
  FaFilter,
  FaBuilding,
  FaBox,
  FaCreditCard,
  FaCalculator,
  FaUserCog
} from "react-icons/fa";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branchName?: string;
  status: 'active' | 'inactive';
}

const RoleManagement = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'users'>('roles');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Define all available permissions based on your matrix
  const permissions: Permission[] = [
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

  // Define roles with their permissions based on your matrix
  const roles: Role[] = [
    {
      id: 'admin',
      name: 'Admin',
      description: 'Full system access with all permissions',
      permissions: [
        'user_management_full',
        'service_management_full',
        'order_management_full',
        'branch_management_full',
        'payments_full',
        'accounting_full'
      ],
      userCount: 2
    },
    {
      id: 'branch_manager',
      name: 'Branch Manager',
      description: 'Manages operations for their assigned branch',
      permissions: [
        'service_management_full',
        'order_management_branch',
        'branch_management_own',
        'accounting_branch'
      ],
      userCount: 5
    },
    {
      id: 'rider',
      name: 'Rider',
      description: 'Handles delivery and pickup operations',
      permissions: [
        'order_management_delivery'
      ],
      userCount: 12
    },
    {
      id: 'customer',
      name: 'Customer',
      description: 'Basic customer access to their own data',
      permissions: [
        'user_management_profile',
        'service_management_read',
        'order_management_own',
        'payments_own'
      ],
      userCount: 150
    }
  ];

  // Mock users data
  const users: User[] = [
    { id: '1', name: 'Admin User', email: 'admin@laundry.com', role: 'admin', status: 'active' },
    { id: '2', name: 'John Manager', email: 'john@laundry.com', role: 'branch_manager', branchName: 'Main Branch', status: 'active' },
    { id: '3', name: 'Mike Rider', email: 'mike@laundry.com', role: 'rider', status: 'active' },
    { id: '4', name: 'Jane Customer', email: 'jane@laundry.com', role: 'customer', status: 'active' },
  ];

  const getPermissionsByCategory = (rolePermissions: string[]) => {
    const categories: { [key: string]: Permission[] } = {};
    
    permissions.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });

    return categories;
  };

  const hasPermission = (rolePermissions: string[], permissionId: string) => {
    return rolePermissions.includes(permissionId);
  };

  const getPermissionIcon = (category: string) => {
    switch (category) {
      case 'User Management': return FaUserCog;
      case 'Service Management': return FaCog;
      case 'Order Management': return FaBox;
      case 'Branch Management': return FaBuilding;
      case 'Payments': return FaCreditCard;
      case 'Accounting': return FaCalculator;
      default: return FaCog;
    }
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 md:p-6 pt-16 md:pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("roles.title")}</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          <FaPlus className="h-4 w-4" />
          Add New Role
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { key: 'roles', label: 'Roles', icon: FaUserShield },
            { key: 'permissions', label: 'Permissions', icon: FaCog },
            { key: 'users', label: 'Users', icon: FaUsers }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <FaFilter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Roles List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">System Roles</h2>
            {filteredRoles.map(role => (
              <div
                key={role.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedRole === role.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{role.name}</h3>
                    <p className="text-gray-600 text-sm">{role.description}</p>
                    <p className="text-gray-500 text-xs mt-1">{role.userCount} users assigned</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-100 rounded">
                      <FaEdit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Role Details */}
          <div className="bg-white border rounded-lg p-6">
            {selectedRole ? (
              <div>
                {(() => {
                  const role = roles.find(r => r.id === selectedRole);
                  if (!role) return null;

                  const categorizedPermissions = getPermissionsByCategory(role.permissions);

                  return (
                    <>
                      <h3 className="text-xl font-semibold mb-4">{role.name} Permissions</h3>
                      <div className="space-y-4">
                        {Object.entries(categorizedPermissions).map(([category, categoryPermissions]) => {
                          const Icon = getPermissionIcon(category);
                          return (
                            <div key={category} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Icon className="h-5 w-5 text-blue-600" />
                                <h4 className="font-medium">{category}</h4>
                              </div>
                              <div className="space-y-2">
                                {categoryPermissions.map(permission => (
                                  <div key={permission.id} className="flex items-center justify-between py-2">
                                    <div>
                                      <p className="font-medium text-sm">{permission.name}</p>
                                      <p className="text-gray-500 text-xs">{permission.description}</p>
                                    </div>
                                    {hasPermission(role.permissions, permission.id) ? (
                                      <FaCheck className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <FaTimes className="h-4 w-4 text-red-500" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <FaUserShield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Select a role to view its permissions</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Permission Matrix</h2>
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feature
                    </th>
                    {roles.map(role => (
                      <th key={role.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(getPermissionsByCategory(permissions.map(p => p.id))).map(([category, categoryPermissions]) => (
                    <React.Fragment key={category}>
                      <tr className="bg-gray-25">
                        <td colSpan={roles.length + 1} className="px-6 py-2 font-semibold text-gray-900 bg-gray-100">
                          {category}
                        </td>
                      </tr>
                      {categoryPermissions.map(permission => (
                        <tr key={permission.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                              <div className="text-sm text-gray-500">{permission.description}</div>
                            </div>
                          </td>
                          {roles.map(role => (
                            <td key={role.id} className="px-6 py-4 whitespace-nowrap text-center">
                              {hasPermission(role.permissions, permission.id) ? (
                                <FaCheck className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <FaTimes className="h-5 w-5 text-red-500 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">User Management</h2>
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.branchName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          <FaEdit className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
