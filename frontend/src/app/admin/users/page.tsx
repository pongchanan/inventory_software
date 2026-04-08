"use client";

import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { User, Borrowing, PaginatedBorrowings } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Shield,
  ShieldOff,
  CreditCard,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Package,
  Loader2,
  Users as UsersIcon,
} from "lucide-react";

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<User[]>("/api/users/", { token });
      setUsers(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.card_id && u.card_id.toLowerCase().includes(q))
    );
  });

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const blacklistedCount = users.filter((u) => u.is_blacklist).length;
  const cardLinked = users.filter((u) => u.card_id).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalUsers} users &middot; {adminCount} admins &middot; {cardLinked} cards linked
          {blacklistedCount > 0 && (
            <span className="text-red-500"> &middot; {blacklistedCount} blacklisted</span>
          )}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or card ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* User list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full shrink-0" />
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
          <UsersIcon size={48} className="mx-auto mb-3 opacity-50" />
          <p>No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <UserRow key={u.id} user={u} token={token} onUpdate={fetchUsers} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── User Row (expandable) ─── */
function UserRow({
  user,
  token,
  onUpdate,
}: {
  user: User;
  token: string | null;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [borrows, setBorrows] = useState<Borrowing[]>([]);
  const [loadingBorrows, setLoadingBorrows] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null); // "blacklist" | "role"

  async function toggleBlacklist() {
    setUpdating("blacklist");
    try {
      await api(`/api/users/${user.id}`, {
        method: "PATCH",
        body: { is_blacklist: !user.is_blacklist },
        token,
      });
      onUpdate();
    } catch {
      // silently fail
    } finally {
      setUpdating(null);
    }
  }

  async function toggleRole() {
    setUpdating("role");
    try {
      await api(`/api/users/${user.id}`, {
        method: "PATCH",
        body: { role: user.role === "admin" ? "user" : "admin" },
        token,
      });
      onUpdate();
    } catch {
      // silently fail
    } finally {
      setUpdating(null);
    }
  }

  async function loadBorrows() {
    if (borrows.length > 0) return; // already loaded
    setLoadingBorrows(true);
    try {
      const data = await api<PaginatedBorrowings>(
        `/api/borrowings/users/${user.id}`,
        { token, params: { page: 1, page_size: 20 } },
      );
      setBorrows(data.borrowings);
    } catch {
      // silently fail
    } finally {
      setLoadingBorrows(false);
    }
  }

  function handleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next) loadBorrows();
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`bg-white border rounded-xl transition-shadow ${
        user.is_blacklist ? "border-red-200 bg-red-50/30" : "border-gray-200"
      }`}
    >
      {/* Main row */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              user.role === "admin"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
              {user.role === "admin" && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              )}
              {user.is_blacklist && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                  Blacklisted
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <CreditCard size={11} />
                {user.card_id ? (
                  <span className="text-emerald-600 font-medium">{user.card_id}</span>
                ) : (
                  <span className="text-gray-400">No card</span>
                )}
              </span>
              <span>
                Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Toggle role */}
            <button
              onClick={toggleRole}
              disabled={updating === "role"}
              title={user.role === "admin" ? "Remove admin" : "Make admin"}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {updating === "role" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : user.role === "admin" ? (
                <ShieldOff size={16} />
              ) : (
                <Shield size={16} />
              )}
            </button>

            {/* Toggle blacklist — hidden for admins */}
            {user.role !== "admin" && (
            <button
              onClick={toggleBlacklist}
              disabled={updating === "blacklist"}
              title={user.is_blacklist ? "Unblacklist" : "Blacklist"}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                user.is_blacklist
                  ? "text-red-500 hover:text-emerald-600 hover:bg-emerald-50"
                  : "text-gray-400 hover:text-red-600 hover:bg-red-50"
              }`}
            >
              {updating === "blacklist" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : user.is_blacklist ? (
                <CheckCircle2 size={16} />
              ) : (
                <Ban size={16} />
              )}
            </button>
            )}

            {/* Expand */}
            <button
              onClick={handleExpand}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded: active borrows */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 sm:px-5 py-4 bg-gray-50/50">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Active Borrowings
          </h4>
          {loadingBorrows ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 size={14} className="animate-spin" />
              Loading…
            </div>
          ) : borrows.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No active borrowings</p>
          ) : (
            <div className="space-y-2">
              {borrows.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100"
                >
                  <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden shrink-0">
                    {b.item?.image_url ? (
                      <img src={b.item.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package size={14} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {b.item?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Due {new Date(b.due_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {new Date(b.due_at) < new Date() && (
                        <span className="text-red-500 font-medium ml-1">Overdue</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
