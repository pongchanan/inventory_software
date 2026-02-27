"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  fetchAllLoans,
  fetchItems,
  fetchUsers,
  returnLoan,
  createLoan,
  Loan,
  Item,
  AuthUser,
  LoanCreate,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Undo2,
  Plus,
  Search,
  Clock,
  AlertTriangle,
  ArrowDownUp,
} from "lucide-react";

type TabFilter = "active" | "overdue" | "returned" | "all";

export default function LoansPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [returningId, setReturningId] = useState<number | null>(null);

  // Filters
  const [tab, setTab] = useState<TabFilter>("active");
  const [search, setSearch] = useState("");

  // New loan form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LoanCreate>({
    user_uid: "",
    item_uid: "",
    due_at: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [authLoading, user, isAdmin, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [loansData, itemsData, usersData] = await Promise.all([
        fetchAllLoans(),
        fetchItems(),
        fetchUsers(),
      ]);
      setLoans(loansData);
      setItems(itemsData);
      setUsers(usersData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  // Lookup maps
  const itemMap = useMemo(() => {
    const map = new Map<string, Item>();
    items.forEach((i) => map.set(i.uid, i));
    return map;
  }, [items]);

  const userMap = useMemo(() => {
    const map = new Map<string, AuthUser>();
    users.forEach((u) => map.set(u.uid, u));
    return map;
  }, [users]);

  // Filtered loans
  const filtered = useMemo(() => {
    let result = loans;

    // Tab filter
    if (tab === "active") {
      result = result.filter((l) => l.status === "active");
    } else if (tab === "overdue") {
      result = result.filter(
        (l) =>
          l.status === "overdue" ||
          (l.status === "active" && new Date(l.due_at) < new Date()),
      );
    } else if (tab === "returned") {
      result = result.filter((l) => l.status === "returned");
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => {
        const itemName = itemMap.get(l.item_uid)?.name?.toLowerCase() || "";
        const userName = userMap.get(l.user_uid)?.name?.toLowerCase() || "";
        return (
          l.item_uid.toLowerCase().includes(q) ||
          l.user_uid.toLowerCase().includes(q) ||
          itemName.includes(q) ||
          userName.includes(q)
        );
      });
    }

    return result;
  }, [loans, tab, search, itemMap, userMap]);

  const handleReturn = async (loanId: number) => {
    if (!confirm("Mark this loan as returned?")) return;
    setReturningId(loanId);
    try {
      await returnLoan(loanId);
      setSuccessMsg("Item returned successfully!");
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to return item");
    }
    setReturningId(null);
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const created = await createLoan(form);
      setSuccessMsg(
        `Loan created: ${itemMap.get(created.item_uid)?.name || created.item_uid} borrowed by ${userMap.get(created.user_uid)?.name || created.user_uid}`,
      );
      setForm({ user_uid: "", item_uid: "", due_at: "" });
      setShowForm(false);
      loadData();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to create loan");
    }
    setSubmitting(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue = (loan: Loan) =>
    (loan.status === "active" || loan.status === "overdue") &&
    new Date(loan.due_at) < new Date();

  const daysUntilDue = (dueAt: string) => {
    const diff = new Date(dueAt).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Stats
  const activeCount = loans.filter((l) => l.status === "active").length;
  const overdueCount = loans.filter(
    (l) =>
      l.status === "overdue" ||
      (l.status === "active" && new Date(l.due_at) < new Date()),
  ).length;
  const returnedCount = loans.filter((l) => l.status === "returned").length;

  // Available items for the form (items that are currently available)
  const availableItems = items.filter((i) => i.available);

  if (authLoading || (!isAdmin && !authLoading)) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" />
            Borrowing Tracker
          </h1>
          <p className="text-sm text-muted mt-1">
            Track who is borrowing which items and when they&apos;re due
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setSubmitError(null);
          }}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New Loan"}
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <ArrowDownUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            <p className="text-xs text-muted">Active Loans</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{overdueCount}</p>
            <p className="text-xs text-muted">Overdue</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {returnedCount}
            </p>
            <p className="text-xs text-muted">Returned</p>
          </div>
        </div>
      </div>

      {/* Success / Error banners */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg border border-green-200">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* New Loan Form */}
      {showForm && (
        <form
          onSubmit={handleCreateLoan}
          className="bg-white rounded-xl border border-border p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold">Create New Loan</h2>

          {submitError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Borrower
              </label>
              <select
                required
                value={form.user_uid}
                onChange={(e) => setForm({ ...form, user_uid: e.target.value })}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select a user...</option>
                {users
                  .filter((u) => u.authorized)
                  .map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.name} ({u.uid})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Item
              </label>
              <select
                required
                value={form.item_uid}
                onChange={(e) => setForm({ ...form, item_uid: e.target.value })}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select an item...</option>
                {availableItems.map((i) => (
                  <option key={i.uid} value={i.uid}>
                    {i.name} ({i.uid})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Due Date
              </label>
              <input
                type="datetime-local"
                required
                value={form.due_at}
                onChange={(e) => setForm({ ...form, due_at: e.target.value })}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Loan
            </button>
          </div>
        </form>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(
            [
              { key: "active", label: "Active", count: activeCount },
              { key: "overdue", label: "Overdue", count: overdueCount },
              { key: "returned", label: "Returned", count: returnedCount },
              { key: "all", label: "All", count: loans.length },
            ] as { key: TabFilter; label: string; count: number }[]
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
              <span className="ml-1 text-xs opacity-60">({count})</span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by user or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm border border-border rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Loans Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading loans...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No loans found</p>
          <p className="text-sm">
            {tab === "active"
              ? "No items are currently being borrowed."
              : tab === "overdue"
                ? "No overdue loans. Everything is on time!"
                : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-muted">
                    Borrower
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted">
                    Item
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted">
                    Borrowed
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted">
                    Due Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((loan) => {
                  const borrower = userMap.get(loan.user_uid);
                  const item = itemMap.get(loan.item_uid);
                  const overdue = isOverdue(loan);
                  const days = daysUntilDue(loan.due_at);

                  return (
                    <tr
                      key={loan.id}
                      className={`border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors ${
                        overdue ? "bg-red-50/30" : ""
                      }`}
                    >
                      {/* Borrower */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {borrower?.name || loan.user_uid}
                          </p>
                          <p className="text-xs text-muted">
                            UID: {loan.user_uid}
                          </p>
                        </div>
                      </td>

                      {/* Item */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {item?.name || loan.item_uid}
                          </p>
                          <p className="text-xs text-muted">
                            {item?.category || "—"} · {item?.location || "—"}
                          </p>
                        </div>
                      </td>

                      {/* Borrowed date */}
                      <td className="px-4 py-3 text-muted whitespace-nowrap">
                        {formatDate(loan.borrowed_at)}
                      </td>

                      {/* Due date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {overdue ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          ) : loan.status === "returned" ? null : (
                            <Clock className="w-3.5 h-3.5 text-muted" />
                          )}
                          <span
                            className={
                              overdue
                                ? "text-red-600 font-medium"
                                : "text-foreground"
                            }
                          >
                            {formatDate(loan.due_at)}
                          </span>
                        </div>
                        {loan.status !== "returned" && (
                          <p
                            className={`text-xs mt-0.5 ${overdue ? "text-red-500" : "text-muted"}`}
                          >
                            {overdue
                              ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue`
                              : `${days} day${days !== 1 ? "s" : ""} left`}
                          </p>
                        )}
                        {loan.returned_at && (
                          <p className="text-xs text-green-600 mt-0.5">
                            Returned: {formatDate(loan.returned_at)}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            loan.status === "returned"
                              ? "bg-green-100 text-green-700"
                              : overdue
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {overdue && loan.status !== "returned"
                            ? "Overdue"
                            : loan.status.charAt(0).toUpperCase() +
                              loan.status.slice(1)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        {loan.status !== "returned" && (
                          <button
                            onClick={() => handleReturn(loan.id)}
                            disabled={returningId === loan.id}
                            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-hover font-medium disabled:opacity-50"
                          >
                            {returningId === loan.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Undo2 className="w-3.5 h-3.5" />
                            )}
                            Return
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
