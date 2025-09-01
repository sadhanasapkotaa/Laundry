"use client";

import "../../types/i18n";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  onPageChange?: (page: string) => void;
}

export default function Layout({
  children,
  currentPage,
  onPageChange,
}: LayoutProps) {
  const pathname = usePathname();
  const [activePage, setActivePage] = useState(currentPage || "dashboard");
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update active page based on current route
  useEffect(() => {
    if (!isClient) return;
    
    const pathMap: { [key: string]: string } = {
      "/dashboard": "dashboard",
      "/branch-manager": "branch-managers",
      "/branch": "branches",
      "/orders": "orders",
      "/income": "income",
      "/expenses": "expenses",
      "/clients": "clients",
      "/payments": "payments",
      "/roles": "roles",
      "/backup-export": "backup-export",
      "/delivery": "delivery",
    };

    const currentPath = Object.keys(pathMap).find(path => 
      pathname.startsWith(path)
    );
    
    if (currentPath) {
      setActivePage(pathMap[currentPath]);
    }
  }, [pathname, isClient]);

  const handlePageChange = (page: string) => {
    setActivePage(page);
    if (onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        currentPage={activePage} 
        onPageChange={handlePageChange} 
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 
