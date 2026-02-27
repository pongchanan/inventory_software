"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchItems,
  createItemAuth,
  deleteItemAuth,
  uploadItemImageAuth,
  Item,
  ItemCreate,
  fetchImageUrl,
  fetchLoanDetails,
  fetchActiveLoanDetails,
  fetchCabinetAccessLogs,
  LoanDetail,
  AuditLogDetail,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  ImageIcon,
  Package,
  History,
  Users,
  Clock,
  AlertTriangle,
} from "lucide-react";

const emptyForm: ItemCreate = {
  uid: "",
  name: "",
  description: "",
  category: "",
  quantity: 1,
  available: true,
  location: "",
};

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ItemCreate>({ ...emptyForm });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [uploadingUid, setUploadingUid] = useState<string | null>(null);

  // New state for loans and cabinet access
  const [activeTab, setActiveTab] = useState<"items" | "loans" | "cabinet">("items");
  const [loans, setLoans] = useState<LoanDetail[]>([]);
  const [activeLoans, setActiveLoans] = useState<LoanDetail[]>([]);
  const [cabinetLogs, setCabinetLogs] = useState<AuditLogDetail[]>([]);
  const [loansLoading, setLoansLoading] = useState(false);
  const [cabinetLoading, setCabinetLoading] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [authLoading, user, isAdmin, router]);

  const loadItems = useCallback(() => {
    setLoading(true);
    fetchItems()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let mounted = true;

    // Defer initialization to avoid synchronous state update in effect
    setTimeout(() => {
      if (!mounted) return;
      setLoading(true);
      fetchItems()
        .then((data) => {
          if (mounted) setItems(data);
        })
        .catch((e) => {
          if (mounted) setError(e.message);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }, 0);

    return () => { mounted = false; };
  }, []);
  const loadLoans = useCallback(() => {
    setLoansLoading(true);
    Promise.all([
      fetchLoanDetails(),
      fetchActiveLoanDetails()
    ])
      .then(([allLoans, active]) => {
        setLoans(allLoans);
        setActiveLoans(active);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoansLoading(false));
  }, []);

  const loadCabinetLogs = useCallback(() => {
    setCabinetLoading(true);
    fetchCabinetAccessLogs(72) // Last 72 hours
      .then(setCabinetLogs)
      .catch((e) => setError(e.message))
      .finally(() => setCabinetLoading(false));
  }, []);

  useEffect(() => {
    let mounted = true;
    setTimeout(() => {
      if (!mounted) return;
      if (activeTab === "loans") {
        loadLoans();
      } else if (activeTab === "cabinet") {
        loadCabinetLogs();
      }
    }, 0);

    return () => { mounted = false; };
  }, [activeTab, loadLoans, loadCabinetLogs]);

  const handleImageSelect = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSuccessMsg(null);

    try {
      const created = await createItemAuth(form);

      // Upload image if selected
      if (imageFile) {
        await uploadItemImageAuth(created.uid, imageFile);
      }

      setSuccessMsg(`Item "${created.name}" created successfully!`);
      setForm({ ...emptyForm });
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
      loadItems();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create item",
      );
    }
    setSubmitting(false);
  };

  const handleDelete = async (uid: string) => {
    if (!confirm(`Delete item ${uid}? This cannot be undone.`)) return;
    setDeletingUid(uid);
    try {
      await deleteItemAuth(uid);
      setSuccessMsg(`Item ${uid} deleted.`);
      loadItems();
    } catch {
      setError("Failed to delete item");
    }
    setDeletingUid(null);
  };

  const handleUploadImage = async (uid: string, file: File) => {
    setUploadingUid(uid);
    try {
      await uploadItemImageAuth(uid, file);
      setSuccessMsg(`Image uploaded for ${uid}`);
      loadItems();
    } catch {
      setError("Failed to upload image");
    }
    setUploadingUid(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Admin Panel
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage inventory, track borrowing, and monitor cabinet access
          </p>
        </div>

        {activeTab === "items" && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setSubmitError(null);
            }}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "Add Item"}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("items")}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === "items"
            ? "text-primary border-b-2 border-primary"
            : "text-muted hover:text-foreground"
            }`}
        >
          <Package className="w-4 h-4" />
          Items
        </button>
        <button
          onClick={() => setActiveTab("loans")}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === "loans"
            ? "text-primary border-b-2 border-primary"
            : "text-muted hover:text-foreground"
            }`}
        >
          <Users className="w-4 h-4" />
          Borrowed Items
        </button>
        <button
          onClick={() => setActiveTab("cabinet")}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === "cabinet"
            ? "text-primary border-b-2 border-primary"
            : "text-muted hover:text-foreground"
            }`}
        >
          <History className="w-4 h-4" />
          Cabinet Access
        </button>
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

      {/* Add Item Form */}
      {showForm && activeTab === "items" && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-border p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold">New Item</h2>

          {submitError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                UID (RFID) *
              </label>
              <input
                type="text"
                required
                value={form.uid}
                onChange={(e) => setForm({ ...form, uid: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. RFID001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Arduino Kit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Category
              </label>
              <input
                type="text"
                value={form.category || ""}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Electronics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Location (Compartment)
              </label>
              <input
                type="text"
                value={form.location || ""}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. A1-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                value={form.quantity || 1}
                onChange={(e) =>
                  setForm({ ...form, quantity: parseInt(e.target.value) || 1 })
                }
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.available ?? true}
                  onChange={(e) =>
                    setForm({ ...form, available: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                Available
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Item description..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Image
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 text-sm text-foreground px-4 py-2 rounded-lg transition-colors">
                <ImageIcon className="w-4 h-4" />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleImageSelect(e.target.files?.[0] || null)
                  }
                />
              </label>
              {imageFile && (
                <span className="text-sm text-muted">{imageFile.name}</span>
              )}
            </div>
            {imagePreview && (
              <div className="mt-3 relative w-40 h-28 rounded-lg overflow-hidden border border-border">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {submitting ? "Creating..." : "Create Item"}
            </button>
          </div>
        </form>
      )}

      {/* Items Table */}
      {activeTab === "items" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading items...
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Image</th>
                      <th className="px-4 py-3">UID</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <AdminItemImage
                            item={item}
                            imageUrls={imageUrls}
                            setImageUrls={setImageUrls}
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{item.uid}</td>
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-muted">
                          {item.category || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {item.location || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.available
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                              }`}
                          >
                            {item.available ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Upload Image */}
                            <label
                              className={`cursor-pointer p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors ${uploadingUid === item.uid
                                ? "opacity-50 pointer-events-none"
                                : ""
                                }`}
                              title="Upload image"
                            >
                              {uploadingUid === item.uid ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadImage(item.uid, file);
                                  e.target.value = "";
                                }}
                              />
                            </label>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(item.uid)}
                              disabled={deletingUid === item.uid}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
                              title="Delete item"
                            >
                              {deletingUid === item.uid ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {items.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-muted">
                          No items yet. Click &quot;Add Item&quot; to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loans Tab */}
      {activeTab === "loans" && (
        <div className="space-y-4">
          {loansLoading ? (
            <div className="flex items-center justify-center py-20 text-muted">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading borrowed items...
            </div>
          ) : (
            <>
              {/* Active Loans */}
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 bg-yellow-50 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    Currently Borrowed ({activeLoans.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Borrower</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Borrowed</th>
                        <th className="px-4 py-3">Due</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activeLoans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium">{loan.user_name}</td>
                          <td className="px-4 py-3 text-muted text-xs">{loan.user_email || "—"}</td>
                          <td className="px-4 py-3 font-medium">{loan.item_name}</td>
                          <td className="px-4 py-3 text-muted">{loan.item_category || "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted">
                            {new Date(loan.borrowed_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted">
                            {new Date(loan.due_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${loan.status === "overdue"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                                }`}
                            >
                              {loan.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {activeLoans.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-muted">
                            No active loans
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* All Loans History */}
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Borrowing History ({loans.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Borrower</th>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Borrowed</th>
                        <th className="px-4 py-3">Returned</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {loans.slice(0, 50).map((loan) => (
                        <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium">{loan.user_name}</td>
                          <td className="px-4 py-3">{loan.item_name}</td>
                          <td className="px-4 py-3 text-xs text-muted">
                            {new Date(loan.borrowed_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted">
                            {loan.returned_at ? new Date(loan.returned_at).toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${loan.status === "returned"
                                ? "bg-green-100 text-green-700"
                                : loan.status === "overdue"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                                }`}
                            >
                              {loan.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {loans.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-muted">
                            No loan history
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Cabinet Access Tab */}
      {activeTab === "cabinet" && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <History className="w-4 h-4" />
              Cabinet Access Logs (Last 72 Hours)
            </h3>
          </div>
          {cabinetLoading ? (
            <div className="flex items-center justify-center py-20 text-muted">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading cabinet access logs...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium text-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">User UID</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cabinetLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium">{log.user_name || "Unknown"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">{log.user}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${log.type === "unlock"
                            ? "bg-blue-100 text-blue-700"
                            : log.type === "lock"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-purple-100 text-purple-700"
                            }`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{log.item || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${log.status === "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{log.message}</td>
                    </tr>
                  ))}
                  {cabinetLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-muted">
                        No cabinet access logs in the last 72 hours
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Small helper component that lazy-loads a presigned image URL for the admin table */
function AdminItemImage({
  item,
  imageUrls,
  setImageUrls,
}: {
  item: Item;
  imageUrls: Record<string, string>;
  setImageUrls: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  useEffect(() => {
    if (item.image_url && !imageUrls[item.uid]) {
      fetchImageUrl(item.uid).then((url) =>
        setImageUrls((prev) => ({ ...prev, [item.uid]: url })),
      );
    }
  }, [item.uid, item.image_url, imageUrls, setImageUrls]);

  const src = imageUrls[item.uid] || "/placeholder.png";

  return (
    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
      <Image
        src={src}
        alt={item.name}
        fill
        className="object-cover"
        unoptimized
      />
    </div>
  );
}
