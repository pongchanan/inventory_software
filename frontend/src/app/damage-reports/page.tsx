"use client";

import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { DamagedReport, PaginatedBorrowings, Borrowing } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  FileWarning,
  CheckCircle2,
  Clock,
  XCircle,
  ImageIcon,
  Upload,
  X,
  ChevronDown,
} from "lucide-react";

type ReportStatus = "pending" | "approved";

export default function DamageReportsPage() {
  const { token } = useAuth();
  const [reports, setReports] = useState<DamagedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<DamagedReport[]>("/api/damaged-reports/me", { token });
      setReports(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const pendingReports = reports.filter((r) => !r.approved && !r.approved_by);
  const approvedReports = reports.filter((r) => r.approved);
  const deniedReports = reports.filter((r) => !r.approved && r.approved_by !== null);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Damage Reports</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Report damaged items and track report status
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "New Report"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <CreateReportForm
          token={token}
          onCreated={() => {
            setShowForm(false);
            fetchReports();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && reports.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileWarning size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No reports yet</h3>
          <p className="text-sm text-gray-500 mt-1">
            You haven&apos;t submitted any damage reports.
          </p>
        </div>
      )}

      {/* Report sections */}
      {!loading && reports.length > 0 && (
        <div className="space-y-8">
          {/* Pending */}
          {pendingReports.length > 0 && (
            <ReportSection
              title="Pending Review"
              count={pendingReports.length}
              status="pending"
              reports={pendingReports}
            />
          )}

          {/* Approved */}
          {approvedReports.length > 0 && (
            <ReportSection
              title="Approved"
              count={approvedReports.length}
              status="approved"
              reports={approvedReports}
            />
          )}

          {/* Denied */}
          {deniedReports.length > 0 && (
            <ReportSection
              title="Denied"
              count={deniedReports.length}
              status="denied"
              reports={deniedReports}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Report Section ─── */
function ReportSection({
  title,
  count,
  status,
  reports,
}: {
  title: string;
  count: number;
  status: "pending" | "approved" | "denied";
  reports: DamagedReport[];
}) {
  const [collapsed, setCollapsed] = useState(false);

  const badgeClass = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    denied: "bg-red-100 text-red-700",
  }[status];

  return (
    <div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-3 mb-3 group"
      >
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
          {count}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>

      {!collapsed && (
        <div className="space-y-3 animate-fade-in">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} status={status} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Report Card ─── */
function ReportCard({
  report,
  status,
}: {
  report: DamagedReport;
  status: "pending" | "approved" | "denied";
}) {
  const [imgError, setImgError] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const statusConfig = {
    pending: {
      icon: <Clock size={14} />,
      label: "Pending",
      class: "bg-yellow-100 text-yellow-700",
    },
    approved: {
      icon: <CheckCircle2 size={14} />,
      label: "Approved",
      class: "bg-green-100 text-green-700",
    },
    denied: {
      icon: <XCircle size={14} />,
      label: "Denied",
      class: "bg-red-100 text-red-700",
    },
  }[status];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="p-4 flex flex-col sm:flex-row gap-4">
        {/* Illustrated image */}
        <div
          className="w-full sm:w-28 h-36 sm:h-28 bg-gray-50 rounded-lg overflow-hidden shrink-0 cursor-pointer relative group"
          onClick={() => setShowImage(true)}
        >
          {report.illustrated_url && !imgError ? (
            <>
              <img
                src={report.illustrated_url}
                alt="Report illustration"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ImageIcon
                  size={20}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={24} className="text-gray-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h3 className="font-medium text-gray-900">{report.topic}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Item: <span className="text-gray-700">{report.item?.name ?? `#${report.item_id}`}</span>
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${statusConfig.class}`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {report.description}
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-gray-500">
            <span>
              Submitted:{" "}
              <span className="text-gray-700 font-medium">
                {new Date(report.report_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </span>
            <span>Report ID: #{report.id}</span>
          </div>

          {/* Admin comment */}
          {report.admin_comment && (
            <div className="mt-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-gray-500 mb-0.5">Admin Comment</p>
              <p className="text-sm text-gray-700">{report.admin_comment}</p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {showImage && report.illustrated_url && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowImage(false)}
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <button
              onClick={() => setShowImage(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X size={24} />
            </button>
            <img
              src={report.illustrated_url}
              alt="Report illustration"
              className="max-w-full max-h-[85vh] rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Create Report Form ─── */
function CreateReportForm({
  token,
  onCreated,
  onCancel,
}: {
  token: string | null;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loadingBorrows, setLoadingBorrows] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<number | "">("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch active borrowings for dropdown
  useEffect(() => {
    (async () => {
      try {
        const data = await api<PaginatedBorrowings>("/api/borrowings/me", {
          token,
          params: { page: 1, page_size: 100 },
        });
        setBorrowings(data.borrowings);
        if (data.borrowings.length === 1) {
          setSelectedItemId(data.borrowings[0].item_id);
        }
      } catch {
        // ignore
      } finally {
        setLoadingBorrows(false);
      }
    })();
  }, [token]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!image) {
      setError("Please upload an image of the damage.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("topic", topic);
      fd.append("description", description);
      fd.append("image", image);
      if (selectedItemId !== "") {
        fd.append("item_id", String(selectedItemId));
      }

      await api("/api/damaged-reports/", {
        method: "POST",
        formData: fd,
        token,
      });
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Failed to submit report.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-5 animate-fade-in"
    >
      <h2 className="text-lg font-semibold text-gray-900">New Damage Report</h2>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Borrowed item selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Borrowed Item
        </label>
        {loadingBorrows ? (
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ) : borrowings.length === 0 ? (
          <p className="text-sm text-gray-500 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
            You have no active borrowings to report.
          </p>
        ) : (
          <select
            value={selectedItemId}
            onChange={(e) =>
              setSelectedItemId(e.target.value ? Number(e.target.value) : "")
            }
            required
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
          >
            <option value="">Select an item…</option>
            {borrowings.map((b) => (
              <option key={b.id} value={b.item_id}>
                {b.item.name} (Borrowed {new Date(b.borrow_at).toLocaleDateString()})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Topic */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Topic
        </label>
        <input
          type="text"
          required
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Cracked screen, Missing part"
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description
        </label>
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the damage in detail…"
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Damage Photo
        </label>
        {preview ? (
          <div className="relative w-full max-w-xs">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => {
                setImage(null);
                setPreview(null);
              }}
              className="absolute top-2 right-2 bg-white/90 rounded-full p-1 hover:bg-white transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
            <Upload size={24} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">
              Click to upload image
            </span>
            <span className="text-xs text-gray-400 mt-0.5">
              JPEG, PNG accepted
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || borrowings.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileWarning size={16} />
          )}
          Submit Report
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
