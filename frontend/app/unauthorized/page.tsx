"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import {
  FiShield,
  FiHome,
  FiArrowLeft,
  FiLogOut,
  FiUser,
} from "react-icons/fi";

/* ============================
   ✅ INNER COMPONENT (CSR SAFE)
=============================== */
function UnauthorizedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuth();
  const [attemptedAction, setAttemptedAction] = useState<string>("");
  const [requiredRole, setRequiredRole] = useState<string>("");
  const [denialReason, setDenialReason] = useState<string>("");

  useEffect(() => {
    const action = searchParams.get("action") || "access this page";
    const role = searchParams.get("required_role") || "";
    const reason = searchParams.get("reason") || "";

    setAttemptedAction(action);
    setRequiredRole(role);
    setDenialReason(reason);
  }, [searchParams]);

  const handleLogout = () => {
    logout();
  };

  const getRecommendedActions = () => {
    if (!isAuthenticated) {
      return [
        {
          label: "Sign In",
          action: () => router.push("/login"),
          icon: FiUser,
          primary: true,
          description:
            "Sign in with an account that has the required permissions",
        },
      ];
    }

    const actions = [
      {
        label: "Go to Dashboard",
        action: () => router.push("/dashboard"),
        icon: FiHome,
        primary: true,
        description: "Return to your main dashboard",
      },
      {
        label: "Go Back",
        action: () => router.back(),
        icon: FiArrowLeft,
        primary: false,
        description: "Return to the previous page",
      },
    ];

    if (requiredRole && user?.role !== requiredRole) {
      actions.push({
        label: "Switch Account",
        action: handleLogout,
        icon: FiLogOut,
        primary: false,
        description: "Sign out and sign in with a different account",
      });
    }

    return actions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Main Error Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-8 py-6">
            <div className="flex items-center justify-center">
              <div className="bg-white/20 rounded-full p-4">
                <FiShield className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          <div className="px-8 py-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Permission Denied
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              You don&apos;t have the required permissions to{" "}
              {attemptedAction}.
            </p>

            {denialReason && (
              <p className="text-sm text-red-600">
                Reason: {denialReason.replace(/_/g, " ")}
              </p>
            )}

            <div className="text-6xl font-bold text-red-500 mt-6 opacity-20">
              403
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="grid gap-4">
            {getRecommendedActions().map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl border transition-all ${action.primary
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-white hover:bg-gray-50 text-gray-700"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-sm">{action.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================
   ✅ SUSPENSE WRAPPER (FIX)
=============================== */
export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <UnauthorizedContent />
    </Suspense>
  );
}
