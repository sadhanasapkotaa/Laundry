"use client";

import { useAuth } from "../contexts/AuthContext";
import { hasPagePermission, shouldRedirect } from "../config/permissions";
import { getRolePermissions } from "../utils/permissions";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import PermissionDenied from "./PermissionDenied";
import Layout from "../(authenticated)/components/Layout";

interface RouteProtectionProps {
  children: ReactNode;
  requiredPermissions?: string[];
  fallback?: ReactNode;
  useLayout?: boolean;
}

export default function RouteProtection({ 
  children, 
  requiredPermissions,
  fallback,
  useLayout = true
}: RouteProtectionProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Map routes to page IDs for layout
  const getPageFromPath = (path: string): string => {
    if (path.startsWith("/dashboard")) return "dashboard";
    if (path.startsWith("/branch-manager")) return "branch-managers";
    if (path.startsWith("/branch")) return "branches";
    if (path.startsWith("/orders")) return "orders";
    if (path.startsWith("/place-orders")) return "place-orders";
    if (path.startsWith("/income")) return "income";
    if (path.startsWith("/expenses")) return "expenses";
    if (path.startsWith("/clients")) return "clients";
    if (path.startsWith("/payments")) return "payments";
    if (path.startsWith("/roles")) return "roles";
    if (path.startsWith("/backup-export")) return "backup-export";
    if (path.startsWith("/delivery")) return "delivery";
    if (path.startsWith("/customer/dashboard")) return "customer-dashboard";
    if (path.startsWith("/customer")) return "customer";
    if (path.startsWith("/profile")) return "profile";
    return "dashboard";
  };

  // Update current page when pathname changes
  useEffect(() => {
    if (useLayout) {
      const page = getPageFromPath(pathname);
      setCurrentPage(page);
    }
  }, [pathname, useLayout]);

  useEffect(() => {
    if (!isClient || isLoading) return;

    // If no user, redirect to login
    if (!user) {
      setIsRedirecting(true);
      // Include current path as redirect parameter
      const redirectParam = pathname !== '/login' ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.push(`/login${redirectParam}`);
      return;
    }

    // Check if user should be redirected based on role and current path
    const redirectPath = shouldRedirect(user.role, pathname);
    if (redirectPath && redirectPath !== pathname) {
      setIsRedirecting(true);
      router.push(redirectPath);
      return;
    }

    setIsRedirecting(false);
  }, [user, isLoading, pathname, router, isClient]);

  // Handle page navigation for layout
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    
    // Map page IDs to routes
    const pageRoutes: { [key: string]: string } = {
      "dashboard": "/dashboard",
      "branches": "/branch",
      "branch-managers": "/branch-manager",
      "orders": "/orders",
      "place-orders": "/place-orders",
      "income": "/income",
      "expenses": "/expenses",
      "clients": "/clients",
      "payments": "/payments",
      "roles": "/roles",
      "backup-export": "/backup-export",
      "delivery": "/delivery",
      "customer": "/customer/orders",
      "customer-dashboard": "/customer/dashboard",
      "profile": "/profile",
    };

    const route = pageRoutes[page];
    if (route && pathname !== route) {
      router.push(route);
    }
  };

  // Show loading state during SSR, initial client render, or when redirecting
  if (!isClient || isLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user after client hydration, don't render anything (will redirect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Check page permission
  let hasPermission = hasPagePermission(user.role, pathname);
  
  // If specific permissions are required, check them as well
  if (hasPermission && requiredPermissions && requiredPermissions.length > 0) {
    const userPermissions = getRolePermissions(user.role);
    hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
  }
  
  if (!hasPermission) {
    return fallback || <PermissionDenied />;
  }

  // Wrap with layout if requested
  if (useLayout) {
    return (
      <Layout
        currentPage={currentPage}
        onPageChange={handlePageChange}
      >
        {children}
      </Layout>
    );
  }

  return <>{children}</>;
}
