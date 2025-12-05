"use client";

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Loading...</h2>
        <p className="mt-2 text-gray-600">Checking authentication status</p>
      </div>
    </div>
  );
}

function HomeContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Always show loading spinner to prevent hydration mismatch
  // The redirect will happen before user sees the fallback content
  return <LoadingSpinner />;
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeContent />
    </Suspense>
  );
}
