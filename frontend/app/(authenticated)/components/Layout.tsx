"use client";

import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import {
  FaTachometerAlt, // Dashboard
  FaBuilding,      // Branches
  FaBox,           // Orders
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
} from "react-icons/fa";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Layout({
  children,
  currentPage,
  onPageChange,
}: LayoutProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(true); // desktop collapse
  const [isMobileOpen, setIsMobileOpen] = useState(false); // mobile drawer

  const menuItems = [
    {
      id: "dashboard",
      icon: FaTachometerAlt,
      label: t("navigation.dashboard"),
      roles: ["admin", "branch_manager"],
    },
    {
      id: "branches",
      icon: FaBuilding,
      label: t("navigation.branches"),
      roles: ["admin"],
    },
    {
      id: "orders",
      icon: FaBox,
      label: t("navigation.orders"),
      roles: ["admin", "branch_manager", "accountant"],
    },
    {
      id: "income",
      icon: FaArrowUp,
      label: t("navigation.income"),
      roles: ["admin", "branch_manager", "accountant"],
    },
    {
      id: "expenses",
      icon: FaArrowDown,
      label: t("navigation.expenses"),
      roles: ["admin", "branch_manager", "accountant"],
    },
    {
      id: "clients",
      icon: FaUsers,
      label: t("navigation.clients"),
      roles: ["admin", "branch_manager"],
    },
    {
      id: "payments",
      icon: FaCreditCard,
      label: t("navigation.payments"),
      roles: ["admin", "branch_manager", "accountant"],
    },
    {
      id: "roles",
      icon: FaShieldAlt,
      label: t("navigation.roles"),
      roles: ["admin"],
    },
    {
      id: "backup",
      icon: FaDownload,
      label: t("navigation.backup"),
      roles: ["admin"],
    },
    {
      id: "delivery",
      icon: FaTruck,
      label: t("navigation.delivery"),
      roles: ["admin", "branch_manager", "rider"],
    },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r">
      {/* Logo + Collapse Button */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <FaBox className="h-6 w-6" />
          {isOpen && <span className="font-medium">LaundryPro</span>}
        </div>
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden md:block p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Toggle sidebar"
        >
          {isOpen ? "<" : ">"}
        </button>
      </div>

      {/* User Info */}
      {user && (
        <div className={`p-4 text-sm ${!isOpen && "hidden md:block"}`}>
          <p className="font-medium">{user.name}</p>
          <p className="text-gray-500 capitalize">
            {user.role.replace("_", " ")}
          </p>
          {user.branchName && (
            <p className="text-gray-500 text-xs">{user.branchName}</p>
          )}
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onPageChange(item.id);
              setIsMobileOpen(false); // close drawer on mobile
            }}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition
              ${
                currentPage === item.id
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }
              ${!isOpen ? "justify-center md:justify-start" : ""}
            `}
          >
            <item.icon className="h-4 w-4" />
            {isOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 space-y-2 border-t">
        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <FaSignOutAlt className="h-4 w-4" />
          {isOpen && <span>{t("auth.logout")}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex flex-col transition-all duration-300 ${
          isOpen ? "w-64" : "w-16"
        }`}
      >
        {SidebarContent}
      </div>

      {/* Mobile Sidebar (Drawer) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-64 h-full bg-white dark:bg-gray-900 shadow-lg z-50">
            <button
              className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close menu"
            >
              <FaTimes className="h-5 w-5" />
            </button>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b bg-white dark:bg-gray-950 flex items-center px-4">
          {/* Mobile menu button */}
          <button
            className="md:hidden mr-4 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open menu"
          >
            <FaBars className="h-5 w-5" />
          </button>
          <h1 className="font-medium capitalize">
            {currentPage.replace("_", " ")}
          </h1>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
