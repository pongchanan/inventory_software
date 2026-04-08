"use client";

import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { PaginatedBorrowings, Borrowing } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  CalendarDays,
} from "lucide-react";
import Pagination from "@/components/ui/pagination";

type Tab = "active" | "history";
const PAGE_SIZE = 20;

export default function BorrowsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("active");
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on tab change
  useEffect(() => {
    setPage(1);
    setSearch("");
    setDebouncedSearch("");
  }, [tab]);

  const fetchBorrowings = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint =
        tab === "active" ? "/api/borrowings/me" : "/api/borrowings/me/history";
      const data = await api<PaginatedBorrowings>(endpoint, {
        token,
        params: { page, page_size: PAGE_SIZE },
      });

      let filtered = data.borrowings;
      // Client-side search by item name
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        filtered = filtered.filter((b) =>
          b.item.name.toLowerCase().includes(q),
        );
      }

      setBorrowings(filtered);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [token, tab, page, debouncedSearch]);

  useEffect(() => {
    fetchBorrowings();
  }, [fetchBorrowings]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Borrowed Items</h1>
        <p className="text-gray-500 mt-0.5 text-sm">
          View your active and past borrowings
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        <button
          onClick={() => setTab("active")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "active"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Active Borrows
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "history"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Return History
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by item name…"
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 animate-pulse"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && borrowings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Package size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            {tab === "active"
              ? "No active borrows"
              : "No return history"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {tab === "active"
              ? "You don't have any items borrowed right now."
              : "You haven't returned any items yet."}
          </p>
        </div>
      )}

      {/* Borrowing cards */}
      {!loading && borrowings.length > 0 && (
        <>
          <div className="space-y-3">
            {borrowings.map((b) => (
              <BorrowCard key={b.id} borrowing={b} tab={tab} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function BorrowCard({ borrowing, tab }: { borrowing: Borrowing; tab: Tab }) {
  const [imgError, setImgError] = useState(false);
  const now = new Date();
  const dueDate = new Date(borrowing.due_at);
  const borrowDate = new Date(borrowing.borrow_at);
  const isOverdue = tab === "active" && now >= dueDate;

  const daysOverdue = isOverdue
    ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div
      className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row gap-4 transition-all duration-200 hover:shadow-sm ${
        isOverdue ? "border-red-200 bg-red-50/30" : "border-gray-200"
      }`}
    >
      {/* Item image */}
      <div className="w-full sm:w-20 h-32 sm:h-20 bg-gray-50 rounded-lg overflow-hidden shrink-0">
        {borrowing.item.image_url && !imgError ? (
          <img
            src={borrowing.item.image_url}
            alt={borrowing.item.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={24} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h3 className="font-medium text-gray-900 truncate">
              {borrowing.item.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Item ID: {borrowing.item_id}
            </p>
          </div>

          {/* Status badge */}
          {tab === "active" && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                isOverdue
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {isOverdue ? (
                <>
                  <AlertTriangle size={12} />
                  Overdue{daysOverdue > 0 ? ` (${daysOverdue}d)` : ""}
                </>
              ) : (
                <>
                  <Clock size={12} />
                  Active
                </>
              )}
            </span>
          )}

          {tab === "history" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 shrink-0">
              <CheckCircle2 size={12} />
              Returned
            </span>
          )}
        </div>

        {/* Dates */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={14} className="text-gray-400" />
            <span>
              Borrowed:{" "}
              <span className="text-gray-700 font-medium">
                {formatDate(borrowDate)}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className={isOverdue ? "text-red-400" : "text-gray-400"} />
            <span>
              Due:{" "}
              <span
                className={`font-medium ${isOverdue ? "text-red-600" : "text-gray-700"}`}
              >
                {formatDate(dueDate)}
              </span>
            </span>
          </div>
          {tab === "history" && borrowing.return_at && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-green-400" />
              <span>
                Returned:{" "}
                <span className="text-gray-700 font-medium">
                  {formatDate(new Date(borrowing.return_at))}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
