"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";

const AUTH_PATHS = ["/login", "/register"];
const isGuestPath = (pathname: string) => pathname === "/" || pathname.startsWith("/votes");

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    const isAuthPath = AUTH_PATHS.includes(pathname);
    if (!user && !isGuestPath(pathname) && !isAuthPath) {
      router.replace("/login");
    } else if (user && isAuthPath) {
      router.replace("/");
    }
  }, [user, loading, pathname, router]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (AUTH_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  if (!user && !isGuestPath(pathname)) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      {/* Main content — push right on desktop */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen transition-all duration-200">
        <div className="p-4 md:p-6 lg:p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
