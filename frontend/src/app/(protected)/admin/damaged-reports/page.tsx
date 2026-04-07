"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Loader2,
  MessageSquare,
  Eye,
  Download,
} from "lucide-react";
import { fetchAllDamageReports, approveDamageReport, DamagedItemReportOut } from "@/lib/api_client/damaged_reports";
import * as XLSX from "xlsx";

type ReportStatus = "all" | "pending" | "approved";

interface ApprovalModalProps {
  report: DamagedItemReportOut | null;
  isOpen: boolean;
  isApproving: boolean;
  onClose: () => void;
  onApprove: (comment: string) => void;
}

function ApprovalModal({ report, isOpen, isApproving, onClose, onApprove }: ApprovalModalProps) {
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    await onApprove(comment);
    setComment("");
  };

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900">Add Admin Assessment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 p-4 bg-gray-50 rounded-2xl">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Report Summary</p>
          <p className="text-sm font-bold text-gray-900">{report.topic}</p>
          <p className="text-xs text-gray-600">{report.description}</p>
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Enter your assessment or comment... (optional)"
          className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none h-24"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isApproving}
            className="flex-1 px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isApproving}
            className="flex-1 px-4 py-2 text-sm font-bold text-white bg-green-500 rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isApproving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Approving...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> Approve
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report, onApprove }: { report: DamagedItemReportOut; onApprove: (report: DamagedItemReportOut) => void }) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const statusIcons = {
    pending: <Clock size={14} />,
    approved: <CheckCircle2 size={14} />,
    rejected: <AlertTriangle size={14} />,
  };

  const statusLabel = report.approved ? "approved" : "pending";

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-6 space-y-4">
        {/* Header with status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-grow">
            <h3 className="font-black text-gray-900 text-sm sm:text-base">{report.topic}</h3>
            <p className="text-xs text-gray-400 font-bold mt-1">
              {report.item?.name || `Item ${report.item_id}`} • Reported by <span className="text-gray-600">{report.user?.name || 'Unknown'}</span>
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 shrink-0 ${statusColors[statusLabel as keyof typeof statusColors]}`}>
            {statusIcons[statusLabel as keyof typeof statusIcons]}
            {statusLabel === "pending" ? "Pending" : statusLabel === "approved" ? "Approved" : "Rejected"}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{report.description}</p>

        {/* Admin comment if exists */}
        {report.admin_comment && (
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-blue-900 flex items-center gap-2">
              <MessageSquare size={14} /> Admin Assessment
            </p>
            <p className="text-xs text-blue-800 mt-2">{report.admin_comment}</p>
          </div>
        )}

        {/* Image thumbnail */}
        {report.illustrated_url && (
          <div className="relative h-32 sm:h-40 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
            <Image
              src={report.illustrated_url}
              alt="Damage report image"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Actions */}
        {!report.approved && (
          <button
            onClick={() => onApprove(report)}
            className="w-full px-4 py-2 text-xs sm:text-sm font-black text-white bg-green-500 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <Eye size={14} /> Review & Approve
          </button>
        )}
      </div>
    </div>
  );
}

export default function DamagedReportsAdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<DamagedItemReportOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus>("all");
  const [selectedReport, setSelectedReport] = useState<DamagedItemReportOut | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [authLoading, user, isAdmin, router]);

  // Load reports
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAllDamageReports();
        setReports(data);
      } catch (err) {
        console.error("Failed to load damage reports:", err);
        setError(err instanceof Error ? err.message : "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    if (authLoading || !user || !isAdmin) return;
    loadReports();
  }, [authLoading, user, isAdmin]);

  const handleApprove = useCallback(
    async (comment: string) => {
      if (!selectedReport) return;

      try {
        setIsApproving(true);
        await approveDamageReport(selectedReport.id, comment);
        
        // Update local state
        setReports((prev) =>
          prev.map((r) =>
            r.id === selectedReport.id
              ? { ...r, approved: true, admin_comment: comment }
              : r
          )
        );

        setSelectedReport(null);
      } catch (err) {
        console.error("Failed to approve report:", err);
        alert(err instanceof Error ? err.message : "Failed to approve report");
      } finally {
        setIsApproving(false);
      }
    },
    [selectedReport]
  );

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Transform data for export
    const exportData = reports.map((r) => ({
      "Report ID": r.id,
      "Topic": r.topic,
      "Description": r.description,
      "Item": r.item?.name || `Item ${r.item_id}`,
      "Status": r.approved ? "Approved" : "Pending",
      "Submitted": new Date(r.report_at).toLocaleDateString(),
      "Admin Comment": r.admin_comment || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 30 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 30 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Damage Reports");
    const filename = `Damage_Reports_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return !r.approved;
    if (statusFilter === "approved") return r.approved;
    return false;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => !r.approved).length,
    approved: reports.filter((r) => r.approved && !r.admin_comment).length,
    rejected: reports.filter((r) => r.admin_comment && r.approved).length,
  };

  if (authLoading || !user || !isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <AlertTriangle size={32} className="text-amber-500" /> Damage Reports
          </h1>
          <p className="text-gray-500 font-medium mt-1">Review and approve broken item reports submitted by users</p>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
        >
          <Download size={14} /> Export Excel
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Total Reports</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-gray-900">{stats.total}</span>
            <span className="text-gray-400 text-sm font-bold mb-1">submitted</span>
          </div>
          <p className="mt-4 text-[10px] font-bold text-gray-400">All damage reports</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Pending Review</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-yellow-600">{stats.pending}</span>
            <span className="text-yellow-200 text-sm font-bold mb-1">awaiting</span>
          </div>
          <p className="mt-4 text-[10px] font-bold text-gray-400">Awaiting admin approval</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Approved</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-green-600">{stats.approved}</span>
            <span className="text-green-200 text-sm font-bold mb-1">assessed</span>
          </div>
          <p className="mt-4 text-[10px] font-bold text-gray-400">Reviewed damage items</p>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {/* FILTER TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { label: "All Reports", value: "all" as ReportStatus },
          { label: "Pending", value: "pending" as ReportStatus },
          { label: "Approved", value: "approved" as ReportStatus },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-amber-500" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
          <AlertTriangle size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 font-bold">No damage reports found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onApprove={() => setSelectedReport(report)}
            />
          ))}
        </div>
      )}

      {/* APPROVAL MODAL */}
      <ApprovalModal
        report={selectedReport}
        isOpen={selectedReport !== null}
        isApproving={isApproving}
        onClose={() => setSelectedReport(null)}
        onApprove={handleApprove}
      />
    </div>
  );
}
