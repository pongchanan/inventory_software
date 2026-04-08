"use client";

import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { PaginatedPopularItems } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BoxesIcon,
  Package,
  Clock,
  AlertTriangle,
  FileWarning,
  ClipboardList,
  Users,
  Server,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  total_items: number;
  total_quantity: number;
  active_borrows: number;
  overdue_borrows: number;
  total_damage_reports: number;
}

interface DamagedItem {
  item_id: number;
  name: string;
  image: string | null;
  report_count: number;
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [popular, setPopular] = useState<PaginatedPopularItems["items"]>([]);
  const [damaged, setDamaged] = useState<DamagedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, popularData, damagedData] = await Promise.all([
        api<DashboardStats>("/api/admin/dashboard/stats", { token }),
        api<PaginatedPopularItems>("/api/borrowings/popular", {
          token,
          params: { page: 1, page_size: 5 },
        }),
        api<DamagedItem[]>("/api/admin/dashboard/most-damaged", {
          token,
          params: { limit: 5 },
        }),
      ]);
      setStats(statsData);
      setPopular(popularData.items);
      setDamaged(damagedData);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        {/* Stat skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
        {/* Chart skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/3 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-8 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Equipment",
      value: stats?.total_items ?? 0,
      sub: `${stats?.total_quantity ?? 0} total units in stock`,
      icon: <BoxesIcon size={22} />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Active Borrows",
      value: stats?.active_borrows ?? 0,
      sub: "Currently borrowed",
      icon: <Package size={22} />,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Overdue Items",
      value: stats?.overdue_borrows ?? 0,
      sub: "Past due date",
      icon: <AlertTriangle size={22} />,
      color: "bg-red-50 text-red-600",
    },
    {
      label: "Damage Reports",
      value: stats?.total_damage_reports ?? 0,
      sub: "Total submitted",
      icon: <FileWarning size={22} />,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  const navCards = [
    { label: "Asset Management", href: "/admin/assets", icon: <BoxesIcon size={20} />, desc: "Manage inventory items" },
    { label: "Borrowing Control", href: "/admin/borrowings", icon: <ClipboardList size={20} />, desc: "Monitor all borrows" },
    { label: "Damage Reports", href: "/admin/damage-reports", icon: <FileWarning size={20} />, desc: "Review reports" },
    { label: "Manage Users", href: "/admin/users", icon: <Users size={20} />, desc: "User accounts & cards" },
    { label: "Cabinet Logs", href: "/admin/cabinet-logs", icon: <Server size={20} />, desc: "Session activity logs" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Most borrowed */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Most Borrowed Items</h2>
          </div>
          {popular.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No data yet</p>
          ) : (
            <div className="space-y-3">
              {popular.map((item, idx) => (
                <BarItem
                  key={item.item_id}
                  rank={idx + 1}
                  name={item.name}
                  count={item.borrow_count}
                  maxCount={popular[0]?.borrow_count ?? 1}
                  color="bg-blue-500"
                />
              ))}
            </div>
          )}
        </div>

        {/* Most damaged */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={18} className="text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">Most Damaged Equipment</h2>
          </div>
          {damaged.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No data yet</p>
          ) : (
            <div className="space-y-3">
              {damaged.map((item, idx) => (
                <BarItem
                  key={item.item_id}
                  rank={idx + 1}
                  name={item.name}
                  count={item.report_count}
                  maxCount={damaged[0]?.report_count ?? 1}
                  color="bg-amber-500"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation cards */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {navCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{card.label}</h3>
                  <p className="text-xs text-gray-500">{card.desc}</p>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Horizontal Bar Item ─── */
function BarItem({
  rank,
  name,
  count,
  maxCount,
  color,
}: {
  rank: number;
  name: string;
  count: number;
  maxCount: number;
  color: string;
}) {
  const pct = Math.max(8, (count / maxCount) * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-gray-400 w-5 text-center">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 truncate">{name}</span>
          <span className="text-xs font-semibold text-gray-500 ml-2 shrink-0">
            {count}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${color} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
