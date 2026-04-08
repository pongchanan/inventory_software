"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Package,
  FileWarning,
  LayoutDashboard,
  BoxesIcon,
  ClipboardList,
  AlertTriangle,
  Users,
  Server,
  Menu,
  X,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: <Home size={20} /> },
  { label: "My Borrows", href: "/borrows", icon: <Package size={20} /> },
  {
    label: "Damage Reports",
    href: "/damage-reports",
    icon: <FileWarning size={20} />,
  },
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard size={20} />,
    adminOnly: true,
  },
  {
    label: "Assets",
    href: "/admin/assets",
    icon: <BoxesIcon size={20} />,
    adminOnly: true,
  },
  {
    label: "Borrowing Control",
    href: "/admin/borrowings",
    icon: <ClipboardList size={20} />,
    adminOnly: true,
  },
  {
    label: "Damage Reports",
    href: "/admin/damage-reports",
    icon: <AlertTriangle size={20} />,
    adminOnly: true,
  },
  {
    label: "Manage Users",
    href: "/admin/users",
    icon: <Users size={20} />,
    adminOnly: true,
  },
  {
    label: "Cabinet Logs",
    href: "/admin/cabinet-logs",
    icon: <Server size={20} />,
    adminOnly: true,
  },
];

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navContent = (
    <nav className="flex flex-col h-full">
      {/* Logo / Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
        {!collapsed && (
          <span className="text-lg font-bold text-gray-900 truncate">
            Inventory
          </span>
        )}
        {/* Desktop collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft
            size={18}
            className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 rounded-md hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>

      {/* Links */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {isAdmin && !collapsed && (
          <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            User
          </p>
        )}
        {visibleItems
          .filter((i) => !i.adminOnly)
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
              ${
                isActive(item.href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }
              ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}

        {isAdmin && (
          <>
            {!collapsed && (
              <p className="px-3 mt-6 mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Admin
              </p>
            )}
            {collapsed && <hr className="my-3 border-gray-200" />}
            {visibleItems
              .filter((i) => i.adminOnly)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                  ${collapsed ? "justify-center" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
          </>
        )}
      </div>

      {/* User footer */}
      <div className="border-t border-gray-200 p-3">
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}
        >
          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 hover:ring-2 hover:ring-blue-300 transition-all"
            title="My Profile"
          >
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </Link>
          {!collapsed && (
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </Link>
          )}
          <button
            onClick={logout}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <Menu size={22} />
        </button>
        <span className="ml-3 text-lg font-bold text-gray-900">Inventory</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/30 transition-opacity"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 z-30 transition-all duration-200 ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}
