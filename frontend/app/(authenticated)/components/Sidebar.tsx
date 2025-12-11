"use client";

import "../../types/i18n";
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useRouter, usePathname } from "next/navigation";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import {
  FaTachometerAlt, // Dashboard
  FaBuilding,      // Branches
  FaBox,           // Orders
  FaPlus,          // Place Orders
  FaArrowUp,       // Income
  FaArrowDown,     // Expenses
  FaUsers,         // Clients
  FaCreditCard,    // Payments
  FaShieldAlt,     // Roles
  FaDownload,      // Backup
  FaTruck,         // Delivery
  FaSignOutAlt,    // Logout
  FaBars,          // Hamburger
  FaTimes,         // Close
  FaChevronLeft,   // Collapse
  FaChevronRight,  // Expand
  FaUser,          // Profile
} from "react-icons/fa";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true); // desktop collapse
  const [isMobileOpen, setIsMobileOpen] = useState(false); // mobile drawer

  const menuItems = [
    {
      id: "dashboard",
      icon: FaTachometerAlt,
      label: t("navigation.dashboard") || "Dashboard",
      path: "/dashboard",
      roles: ["admin", "branch_manager", "accountant"], // Admin, Branch Managers, and Accountants can access dashboard
    },
    {
      id: "branches",
      icon: FaBuilding,
      label: t("navigation.branches") || "Branch Management",
      path: "/branch",
      roles: ["admin", "branch_manager"], // Admin and Branch Managers can manage branches
    },
    {
      id: "branch-managers",
      icon: FaUsers,
      label: t("navigation.branchManagers") || "Branch Managers",
      path: "/branch-manager",
      roles: ["admin"], // Only admin can manage branch managers
    },
    {
      id: "orders",
      icon: FaBox,
      label: t("navigation.orders") || "Order Management",
      path: "/orders",
      roles: ["admin", "branch_manager", "rider"], // Admin, Branch Managers, and Riders can manage orders
    },
    {
      id: "place-orders",
      icon: FaPlus,
      label: t("navigation.placeOrders") || "Place Orders",
      path: "/place-orders",
      roles: ["admin", "branch_manager"], // Staff can place orders for customers
    },
    {
      id: "income",
      icon: FaArrowUp,
      label: t("navigation.income") || "Income Tracking",
      path: "/income",
      roles: ["admin", "accountant"], // Admin and Accountants can view income
    },
    {
      id: "expenses",
      icon: FaArrowDown,
      label: t("navigation.expenses") || "Expense Tracking",
      path: "/expenses",
      roles: ["admin", "accountant"], // Admin and Accountants can manage expenses
    },
    {
      id: "clients",
      icon: FaUsers,
      label: t("navigation.clients") || "Client Management",
      path: "/clients",
      roles: ["admin", "branch_manager"], // Admin and Branch Managers can manage clients
    },
    {
      id: "payments",
      icon: FaCreditCard,
      label: t("navigation.payments") || "Payment Management",
      path: "/payments",
      roles: ["admin", "branch_manager", "accountant"], // Admin, Branch Managers, and Accountants can manage payments
    },
    {
      id: "roles",
      icon: FaShieldAlt,
      label: t("navigation.roles") || "Role Management",
      path: "/roles",
      roles: ["admin"], // Only admin can manage user roles
    },
    {
      id: "backup-export",
      icon: FaDownload,
      label: t("navigation.backup") || "Backup & Export",
      path: "/backup-export",
      roles: ["admin"], // Only admin can backup and export data
    },
    {
      id: "delivery",
      icon: FaTruck,
      label: t("navigation.delivery") || "Delivery Dashboard",
      path: "/delivery",
      roles: ["admin", "branch_manager", "rider"], // Delivery management for these roles
    },
    // Customer-specific menu items
    {
      id: "customer-orders",
      icon: FaBox,
      label: t("navigation.myOrders") || "My Orders",
      path: "/customer/orders",
      roles: ["customer"],
    },
    {
      id: "customer-place-order",
      icon: FaPlus,
      label: t("navigation.placeOrder") || "Place Order",
      path: "/customer/place-order",
      roles: ["customer"],
    },
    {
      id: "customer-payment",
      icon: FaCreditCard,
      label: t("navigation.payment") || "Payment",
      path: "/customer/payment",
      roles: ["customer"],
    },
    // Profile for all roles (always present)
    {
      id: (user && user.role === "customer") ? "customer-profile" : "profile",
      icon: FaUser,
      label: t("navigation.profile") || "Profile",
      // Use /profile for staff/admin, /customer/profile for customer
      path: (user && user.role === "customer") ? "/customer/profile" : "/profile",
      roles: ["admin", "branch_manager", "accountant", "rider", "customer"],
    },
  ];

  // Create a fallback admin user for development/testing
  const displayUser = user || null;

  // Filter menu items based on user role - maintain role-based access control
  const filteredMenuItems = menuItems.filter(
    (item) => displayUser && item.roles.includes(displayUser.role)
  );

  const handleNavigation = (item: { path: string; id: string }) => {
    router.push(item.path);
    onPageChange(item.id);
  };

  // Get current active item based on pathname
  const getCurrentPage = () => {
    const currentItem = menuItems.find(item => pathname.startsWith(item.path));
    return currentItem?.id || currentPage;
  };

  return (
    <>
      {/* Mobile menu button (to open sidebar) */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-900 shadow-lg border"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open menu"
      >
        <FaBars className="h-5 w-5" />
      </button>

      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex flex-col transition-all duration-300 ease-in-out ${isOpen ? "w-64" : "w-16"
          } h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-sm`}
      >
        {/* Logo + Collapse Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FaBox className="h-5 w-5 text-white" />
            </div>
            {isOpen && (
              <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900 dark:text-white">LaundryPro</span>
                <span className="text-xs text-gray-500">Management System</span>
              </div>
            )}
          </div>
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            {isOpen ? (
              <FaChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <FaChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* User Info */}
        {displayUser && (
          <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${!isOpen && "hidden"}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {displayUser.first_name[0]}{displayUser.last_name[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {displayUser.first_name} {displayUser.last_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize truncate">
                  {displayUser.role.replace("_", " ")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{displayUser.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = getCurrentPage() === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${isActive
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  }
                  ${!isOpen ? "justify-center" : ""}
                `}
                title={!isOpen ? item.label : ""}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"}`} />
                {isOpen && <span className="truncate">{item.label}</span>}
                {isActive && isOpen && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
          {isOpen && (
            <div className="flex justify-center">
              <LanguageSwitcher />
            </div>
          )}
          <button
            onClick={() => logout && logout()}
            className={`flex items-center gap-3 w-full px-3 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${!isOpen ? "justify-center" : ""}`}
            title={!isOpen ? (t("auth.logout") || "Logout") : ""}
          >
            <FaSignOutAlt className="h-5 w-5" />
            {isOpen && <span>{t("auth.logout") || "Logout"}</span>}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar (Drawer) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-80 max-w-[80vw] h-full bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <FaBox className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-gray-900 dark:text-white">LaundryPro</span>
                  <span className="text-xs text-gray-500">Management System</span>
                </div>
              </div>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close menu"
              >
                <FaTimes className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* User Info */}
            {displayUser && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {displayUser.first_name[0]}{displayUser.last_name[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {displayUser.first_name} {displayUser.last_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {displayUser.role.replace("_", " ")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{displayUser.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Menu */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {filteredMenuItems.map((item) => {
                const isActive = getCurrentPage() === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleNavigation(item);
                      setIsMobileOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive
                        ? "bg-blue-500 text-white shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
              <button
                onClick={() => {
                  if (logout) logout();
                  setIsMobileOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <FaSignOutAlt className="h-5 w-5" />
                <span>{t("auth.logout") || "Logout"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
