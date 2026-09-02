"use client";

import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { DamagedReport } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Loader2,
  FileWarning,
  User as UserIcon,
} from "lucide-react";

type Filter = "all" | "pending" | "approved";

export default function AdminDamageReportsPage() {
  const { token } = useAuth();
  const [reports, setReports] = useState<DamagedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  // lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // approve modal
  const [approving, setApproving] = useState<DamagedReport | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<DamagedReport[]>("/api/damaged-reports/", { token });
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

  // client-side filtering
  const filtered = reports.filter((r) => {
    if (filter === "pending" && r.approved) return false;
    if (filter === "approved" && !r.approved) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const matchTopic = r.topic.toLowerCase().includes(q);
      const matchItem = r.item?.name?.toLowerCase().includes(q);
      const matchUser = r.user?.name?.toLowerCase().includes(q);
      if (!matchTopic && !matchItem && !matchUser) return false;
    }
    return true;
  });

  const pendingCount = reports.filter((r) => !r.approved).length;
  const approvedCount = reports.filter((r) => r.approved).length;

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/api/damaged-reports/export`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "damaged_reports.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Damage Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            {reports.length} reports &middot; {pendingCount} pending
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shrink-0 disabled:opacity-50"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Export Excel
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5 w-fit">
        {([
          { key: "all" as Filter, label: "All", count: reports.length },
          { key: "pending" as Filter, label: "Pending", count: pendingCount },
          { key: "approved" as Filter, label: "Approved", count: approvedCount },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                filter === tab.key ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by topic, item, or user…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileWarning size={48} className="mx-auto mb-3 opacity-50" />
          <p>No reports found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onImageClick={setLightboxUrl}
              onApprove={() => setApproving(r)}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
          <img
            src={lightboxUrl}
            alt="Report image"
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Approve modal */}
      {approving && (
        <ApproveModal
          report={approving}
          token={token}
          onClose={() => setApproving(null)}
          onDone={() => {
            setApproving(null);
            fetchReports();
          }}
        />
      )}
    </div>
  );
}

/* ─── Report Card ─── */
function ReportCard({
  report,
  onImageClick,
  onApprove,
}: {
  report: DamagedReport;
  onImageClick: (url: string) => void;
  onApprove: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Image */}
          {report.illustrated_url && (
            <button
              onClick={() => onImageClick(report.illustrated_url)}
              className="w-full sm:w-24 h-40 sm:h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0"
            >
              <img
                src={report.illustrated_url}
                alt={report.topic}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </button>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">{report.topic}</h3>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{report.description}</p>
              </div>

              {/* Status badge */}
              {report.approved ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                  <CheckCircle2 size={12} />
                  Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full shrink-0">
                  <Clock size={12} />
                  Pending
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <UserIcon size={12} />
                {report.user?.name ?? "Unknown"}
              </span>
              <span>Item: {report.item?.name ?? "Unknown"}</span>
              <span>{fmtDate(report.report_at)}</span>
            </div>

            {/* Admin comment */}
            {report.approved && report.admin_comment && (
              <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-medium text-gray-600">Admin note:</span> {report.admin_comment}
              </div>
            )}

            {/* Approve button for pending */}
            {!report.approved && (
              <div className="mt-3">
                <button
                  onClick={onApprove}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <CheckCircle2 size={13} />
                  Review &amp; Approve
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Approve Modal ─── */
function ApproveModal({
  report,
  token,
  onClose,
  onDone,
}: {
  report: DamagedReport;
  token: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleApprove() {
    setSubmitting(true);
    setError("");
    try {
      await api(`/api/damaged-reports/${report.id}/approve`, {
        method: "POST",
        body: { admin_comment: comment || undefined },
        token,
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to approve");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md animate-[fade-in_0.15s_ease-out]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Approve Report</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Report summary */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
            <p>
              <span className="font-medium text-gray-600">Topic:</span>{" "}
              <span className="text-gray-900">{report.topic}</span>
            </p>
            <p>
              <span className="font-medium text-gray-600">Item:</span>{" "}
              <span className="text-gray-900">{report.item?.name ?? "Unknown"}</span>
            </p>
            <p>
              <span className="font-medium text-gray-600">Reported by:</span>{" "}
              <span className="text-gray-900">{report.user?.name ?? "Unknown"}</span>
            </p>
          </div>

          {/* Admin comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Comment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add a note…"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <XCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              <CheckCircle2 size={14} />
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
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
