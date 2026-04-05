"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  useEffect(() => {
    // If auth check is complete and user is not authenticated, redirect to login
    if (!loading && (!token || !user)) {
      router.push("/login");
    }
  }, [loading, token, user, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#ee4d2d] rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, don't render children (while redirect happens)
  if (!token || !user) {
    return null;
  }

  // User is authenticated, render protected content
  return <>{children}</>;
}
