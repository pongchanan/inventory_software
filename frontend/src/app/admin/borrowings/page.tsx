"use client";

import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Borrowing, PaginatedBorrowings } from "@/lib/types";
import Pagination from "@/components/ui/pagination";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Package,
  User as UserIcon,
} from "lucide-react";

type Tab = "active" | "returned";

export default function AdminBorrowingsPage() {
  const { token } = useAuth();
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const pageSize = 20;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchBorrowings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<PaginatedBorrowings>("/api/borrowings/admin/all", {
        token,
        params: { page, page_size: pageSize },
      });
      setBorrowings(data.borrowings);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    fetchBorrowings();
  }, [fetchBorrowings]);

  // client-side tab + search filtering on the current page
  const filtered = borrowings.filter((b) => {
    const isActive = !b.return_at;
    if (tab === "active" && !isActive) return false;
    if (tab === "returned" && isActive) return false;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const matchItem = b.item?.name?.toLowerCase().includes(q);
      const matchUser = b.user?.name?.toLowerCase().includes(q);
      const matchEmail = b.user?.email?.toLowerCase().includes(q);
      if (!matchItem && !matchUser && !matchEmail) return false;
    }
    return true;
  });

  const activeCount = borrowings.filter((b) => !b.return_at).length;
  const returnedCount = borrowings.filter((b) => !!b.return_at).length;

  // reset page on tab change
  useEffect(() => {
    setPage(1);
  }, [tab]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Borrowing Control</h1>
        <p className="text-sm text-gray-500 mt-1">{total} total records</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5 w-fit">
        <TabButton
          active={tab === "active"}
          onClick={() => setTab("active")}
          label="Active"
          count={activeCount}
        />
        <TabButton
          active={tab === "returned"}
          onClick={() => setTab("returned")}
          label="Returned"
          count={returnedCount}
        />
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by item, user, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p>No {tab} borrowings found</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-4 font-medium">Item</th>
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">Borrowed</th>
                  <th className="text-left py-3 px-4 font-medium">Due</th>
                  <th className="text-left py-3 px-4 font-medium">
                    {tab === "active" ? "Status" : "Returned"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => (
                  <BorrowRow key={b.id} borrow={b} tab={tab} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((b) => (
              <BorrowCard key={b.id} borrow={b} tab={tab} />
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

/* ─── Tab Button ─── */
function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
      <span
        className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
          active ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* ─── Helpers ─── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getOverdueDays(dueAt: string): number {
  const now = new Date();
  const due = new Date(dueAt);
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

/* ─── Desktop Row ─── */
function BorrowRow({ borrow, tab }: { borrow: Borrowing; tab: Tab }) {
  const overdue = tab === "active" ? getOverdueDays(borrow.due_at) : 0;

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      {/* Item */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
            {borrow.item?.image_url ? (
              <img
                src={borrow.item.image_url}
                alt={borrow.item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Package size={16} />
              </div>
            )}
          </div>
          <span className="font-medium text-gray-900 truncate max-w-[180px]">
            {borrow.item?.name ?? "Unknown"}
          </span>
        </div>
      </td>

      {/* User */}
      <td className="py-3 px-4">
        <div>
          <p className="font-medium text-gray-900">{borrow.user?.name ?? "Unknown"}</p>
          <p className="text-xs text-gray-400">{borrow.user?.email ?? ""}</p>
        </div>
      </td>

      {/* Borrowed date */}
      <td className="py-3 px-4 text-gray-600">{fmtDate(borrow.borrow_at)}</td>

      {/* Due date */}
      <td className="py-3 px-4">
        <span className={overdue > 0 ? "text-red-600 font-medium" : "text-gray-600"}>
          {fmtDate(borrow.due_at)}
        </span>
      </td>

      {/* Status / Return date */}
      <td className="py-3 px-4">
        {tab === "active" ? (
          overdue > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full">
              <AlertTriangle size={12} />
              {overdue}d overdue
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
              <Clock size={12} />
              On time
            </span>
          )
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            <CheckCircle2 size={12} />
            {fmtDate(borrow.return_at!)}
          </span>
        )}
      </td>
    </tr>
  );
}

/* ─── Mobile Card ─── */
function BorrowCard({ borrow, tab }: { borrow: Borrowing; tab: Tab }) {
  const overdue = tab === "active" ? getOverdueDays(borrow.due_at) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex gap-3">
        {/* Image */}
        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
          {borrow.item?.image_url ? (
            <img
              src={borrow.item.image_url}
              alt={borrow.item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package size={18} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-gray-900 truncate">{borrow.item?.name ?? "Unknown"}</h3>
            {tab === "active" ? (
              overdue > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full shrink-0">
                  <AlertTriangle size={11} />
                  {overdue}d
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                  <Clock size={11} />
                  OK
                </span>
              )
            ) : (
              <span className="text-xs text-gray-400 shrink-0">
                <CheckCircle2 size={12} className="inline mr-0.5" />
                {fmtDate(borrow.return_at!)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <UserIcon size={12} />
            <span className="truncate">{borrow.user?.name ?? "Unknown"}</span>
          </div>

          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span>Borrowed {fmtDate(borrow.borrow_at)}</span>
            <span className={overdue > 0 ? "text-red-500 font-medium" : ""}>
              Due {fmtDate(borrow.due_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
