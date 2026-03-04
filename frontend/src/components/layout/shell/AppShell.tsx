"use client";

import { useMediaQuery } from "../../../services/hooks/useMediaQuery";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { TopHeader } from "./TopHeader";

import { useAuth } from "../../../context/AuthContext";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const pathname = usePathname();
  const { user: currentUser, logout } = useAuth();

  // Allow kiosk, login, and register to be complete fullscreen bypassing the shell entirely
  // although they should be outside the route group anyway, this is a safety measure
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/kiosk") ||
    pathname.startsWith("/register")
  ) {
    return <>{children}</>;
  }

  if (isDesktop === undefined) {
    // Not yet mounted — render children without layout chrome to avoid a blank flash
    return <>{children}</>;
  }

  if (isDesktop) {
    return (
      <div className="flex h-screen bg-[#f8f9fa] font-sans text-gray-800 overflow-hidden">
        <DesktopSidebar
          currentUser={currentUser as any}
          onLogout={logout}
          currentPath={pathname}
        />
        <div className="flex-grow flex flex-col h-full overflow-hidden relative">
          <TopHeader />
          <main className="flex-grow overflow-y-auto w-full no-scrollbar relative z-10">
            {children}
          </main>
          {/* Decorative Background Circles */}
          <div className="fixed -bottom-32 -left-32 w-96 h-96 bg-orange-100 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
          <div className="fixed -top-32 -right-32 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
        </div>
      </div>
    );
  }

  // Mobile Layout
  return (
    <div className="max-w-md mx-auto bg-[#f5f5f5] min-h-screen relative flex flex-col shadow-2xl overflow-hidden font-sans">
      <main className="flex-grow overflow-y-auto pb-20 no-scrollbar relative z-10">
        {/* Mobile specific top header if needed, currently reusing the old view structure which didn't have one */}
        {children}
      </main>
      <MobileBottomNav currentPath={pathname} />
    </div>
  );
}
