"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ClientsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to clients-page since that's the actual implementation
    router.replace("/clients-page");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to clients page...</p>
      </div>
    </div>
  );
}
