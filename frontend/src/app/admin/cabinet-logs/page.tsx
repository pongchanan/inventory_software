"use client";

import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Session, PaginatedSessions } from "@/lib/types";
import Pagination from "@/components/ui/pagination";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  DoorOpen,
  DoorClosed,
  Clock,
  User as UserIcon,
  Image as ImageIcon,
  X,
  Server,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function AdminCabinetLogsPage() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const pageSize = 20;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<PaginatedSessions>("/api/sessions/", {
        token,
        params: { page, page_size: pageSize },
      });
      setSessions(data.sessions);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // client-side search on current page
  const filtered = sessions.filter((s) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      s.user?.name?.toLowerCase().includes(q) ||
      s.user?.email?.toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  });

  const openCount = sessions.filter((s) => !s.close_at).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cabinet Logs</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} sessions total
          {openCount > 0 && (
            <span className="text-amber-600"> &middot; {openCount} currently open</span>
          )}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by user name, email, or session ID…"
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
              <div className="flex gap-4 items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-full shrink-0" />
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
          <Server size={48} className="mx-auto mb-3 opacity-50" />
          <p>No sessions found</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">Opened</th>
                  <th className="text-left py-3 px-4 font-medium">Closed</th>
                  <th className="text-left py-3 px-4 font-medium">Duration</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-center py-3 px-4 font-medium">Image</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <SessionRow key={s.id} session={s} token={token} onImageClick={setLightboxUrl} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((s) => (
              <SessionCard key={s.id} session={s} token={token} onImageClick={setLightboxUrl} />
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
            alt="Close image"
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ─── */
function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " " + d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDuration(openAt: string, closeAt: string | null): string {
  if (!closeAt) return "—";
  const ms = new Date(closeAt).getTime() - new Date(openAt).getTime();
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

/* ─── Desktop Row ─── */
function SessionRow({
  session,
  token,
  onImageClick,
}: {
  session: Session;
  token: string | null;
  onImageClick: (url: string) => void;
}) {
  const isOpen = !session.close_at;

  function handleImageClick() {
    if (!session.close_image_path) return;
    const url = `${API_BASE}/api/sessions/${session.id}/image`;
    // The endpoint returns a 302 redirect to presigned URL — open in lightbox
    onImageClick(`${url}?token=${token}`);
  }

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="py-3 px-4 text-gray-500 font-mono text-xs">#{session.id}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <UserIcon size={14} className="text-gray-400 shrink-0" />
          <div>
            <p className="font-medium text-gray-900">{session.user?.name ?? "Unknown"}</p>
            <p className="text-xs text-gray-400">{session.user?.email ?? ""}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-gray-600 text-xs">{fmtDateTime(session.open_at)}</td>
      <td className="py-3 px-4 text-gray-600 text-xs">
        {session.close_at ? fmtDateTime(session.close_at) : "—"}
      </td>
      <td className="py-3 px-4 text-gray-600 text-xs font-mono">
        {getDuration(session.open_at, session.close_at)}
      </td>
      <td className="py-3 px-4">
        {isOpen ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
            <DoorOpen size={12} />
            Open
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
            <DoorClosed size={12} />
            Closed
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-center">
        {session.close_image_path ? (
          <button
            onClick={handleImageClick}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View close image"
          >
            <ImageIcon size={16} />
          </button>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
    </tr>
  );
}

/* ─── Mobile Card ─── */
function SessionCard({
  session,
  token,
  onImageClick,
}: {
  session: Session;
  token: string | null;
  onImageClick: (url: string) => void;
}) {
  const isOpen = !session.close_at;

  function handleImageClick() {
    if (!session.close_image_path) return;
    onImageClick(`${API_BASE}/api/sessions/${session.id}/image?token=${token}`);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-400 font-mono">#{session.id}</span>
            {isOpen ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                <DoorOpen size={10} />
                Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                <DoorClosed size={10} />
                Closed
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-sm">
            <UserIcon size={13} className="text-gray-400" />
            <span className="font-medium text-gray-900 truncate">{session.user?.name ?? "Unknown"}</span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {fmtDateTime(session.open_at)}
            </span>
            {session.close_at && (
              <span>Duration: {getDuration(session.open_at, session.close_at)}</span>
            )}
          </div>
        </div>

        {session.close_image_path && (
          <button
            onClick={handleImageClick}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
          >
            <ImageIcon size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
