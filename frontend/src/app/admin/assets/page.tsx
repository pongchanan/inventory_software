"use client";

import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { Item, PaginatedItems, EnrollJob } from "@/lib/types";
import Pagination from "@/components/ui/pagination";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Minus,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Video,
  ImageIcon,
  Package,
} from "lucide-react";

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */
export default function AdminAssetsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEnroll, setShowEnroll] = useState(false);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<PaginatedItems>("/api/items/", {
        token,
        params: { page, page_size: pageSize, search: debouncedSearch || undefined },
      });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [token, page, debouncedSearch]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-sm text-gray-500 mt-1">{total} items total</p>
        </div>
        <button
          onClick={() => setShowEnroll(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shrink-0"
        >
          <Plus size={16} />
          Enroll New Item
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Item table / grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="h-32 bg-gray-100 rounded-lg mb-3" />
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p>No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <AssetCard key={item.id} item={item} token={token} onUpdate={fetchItems} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Enroll Modal */}
      {showEnroll && (
        <EnrollModal
          token={token}
          onClose={() => setShowEnroll(false)}
          onDone={() => {
            setShowEnroll(false);
            fetchItems();
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Asset Card
   ═══════════════════════════════════════════ */
function AssetCard({
  item,
  token,
  onUpdate,
}: {
  item: Item;
  token: string | null;
  onUpdate: () => void;
}) {
  const [adjusting, setAdjusting] = useState(false);
  const [delta, setDelta] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isProcessing = item.enroll_status === "processing";
  const isFailed = item.enroll_status === "failed";

  async function handleSaveQty() {
    if (delta === 0) {
      setAdjusting(false);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api(`/api/items/${item.id}/quantity`, {
        method: "PATCH",
        body: { delta },
        token,
      });
      setAdjusting(false);
      setDelta(0);
      onUpdate();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      await api(`/api/items/${item.id}/image`, {
        method: "PUT",
        formData: fd,
        token,
      });
      onUpdate();
    } catch {
      // silently fail
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      {/* Image */}
      <div className="relative h-40 bg-gray-50">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <Package size={40} />
          </div>
        )}

        {/* Status badge */}
        {isProcessing && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded-full">
            <Loader2 size={12} className="animate-spin" />
            Processing
          </div>
        )}
        {isFailed && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
            <AlertCircle size={12} />
            Failed
          </div>
        )}

        {/* Upload overlay button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-2 right-2 p-1.5 bg-white/90 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white transition-colors shadow-sm"
          title="Upload image"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate" title={item.name}>
          {item.name}
        </h3>

        {/* Quantity */}
        <div className="mt-3">
          {!adjusting ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Qty: <span className="font-semibold text-gray-900">{item.quantity}</span>
              </div>
              <button
                onClick={() => setAdjusting(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Adjust
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDelta((d) => d - 1)}
                  disabled={item.quantity + delta <= 0}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-sm text-gray-500">
                    {item.quantity} → <span className="font-bold text-gray-900">{item.quantity + delta}</span>
                  </span>
                  {delta !== 0 && (
                    <span className={`ml-1 text-xs font-medium ${delta > 0 ? "text-green-600" : "text-red-600"}`}>
                      ({delta > 0 ? "+" : ""}
                      {delta})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setDelta((d) => d + 1)}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAdjusting(false);
                    setDelta(0);
                    setError("");
                  }}
                  className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQty}
                  disabled={saving}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Enroll Modal
   ═══════════════════════════════════════════ */
function EnrollModal({
  token,
  onClose,
  onDone,
}: {
  token: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [video, setVideo] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // suggestions state
  const [suggestions, setSuggestions] = useState<Item[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // fetch suggestions when name changes
  useEffect(() => {
    if (!name.trim()) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const data = await api<PaginatedItems>("/api/items/", {
          token,
          params: { search: name, page: 1, page_size: 10 },
        });
        setSuggestions(data.items);
        setShowSuggestions(data.items.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [name, token]);

  // polling state
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<EnrollJob | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // poll job status
  useEffect(() => {
    if (!jobId) return;
    const poll = async () => {
      try {
        const data = await api<EnrollJob>(`/api/items/enroll/jobs/${jobId}`, { token });
        setJob(data);
        if (data.status === "done" || data.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // keep polling
      }
    };
    poll();
    pollRef.current = setInterval(poll, 1500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId, token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!video) {
      setError("Video file is required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("quantity", String(quantity));
      fd.append("video", video);
      if (image) fd.append("image", image);

      const result = await api<{ job_id: string; status: string; item_id: number }>(
        "/api/items/enroll",
        { method: "POST", formData: fd, token },
      );
      setJobId(result.job_id);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to start enrollment");
    } finally {
      setSubmitting(false);
    }
  }

  const isTerminal = job?.status === "done" || job?.status === "failed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={!jobId ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-[fade-in_0.15s_ease-out]">
        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {jobId ? "Enrollment Progress" : "Enroll New Item"}
          </h2>
          {!jobId && (
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          )}
        </div>

        {!jobId ? (
          /* ─── Form ─── */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div ref={suggestRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                ref={inputRef}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Arduino Uno R3"
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setName(item.name);
                        setShowSuggestions(false);
                        inputRef.current?.focus();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-blue-50 transition-colors text-sm"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package size={14} className="text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
              <input
                type="number"
                min={0}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video File <span className="text-red-500">*</span>
              </label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                {video ? (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Video size={18} className="text-blue-500" />
                    <span className="truncate max-w-[200px]">{video.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setVideo(null);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-400">
                    <Upload size={20} className="mx-auto mb-1" />
                    Click to upload video
                  </div>
                )}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                {image ? (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <ImageIcon size={18} className="text-emerald-500" />
                    <span className="truncate max-w-[200px]">{image.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setImage(null);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-400">
                    <ImageIcon size={20} className="mx-auto mb-1" />
                    Click to upload cover image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Start Enrollment
            </button>
          </form>
        ) : (
          /* ─── Job Progress ─── */
          <div className="p-5 space-y-5">
            {/* Status indicator */}
            <div className="flex flex-col items-center text-center py-4">
              {job?.status === "done" ? (
                <CheckCircle2 size={48} className="text-green-500 mb-3" />
              ) : job?.status === "failed" ? (
                <AlertCircle size={48} className="text-red-500 mb-3" />
              ) : (
                <Loader2 size={48} className="text-blue-500 animate-spin mb-3" />
              )}
              <p className="text-lg font-semibold text-gray-900 capitalize">{job?.status ?? "pending"}</p>
              {job?.status === "failed" && job.error && (
                <p className="text-sm text-red-600 mt-1">{job.error}</p>
              )}
            </div>

            {/* Stats */}
            {job && (job.status === "done" || job.status === "running") && (
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Frames Sampled" value={job.frames_sampled ?? "—"} />
                <Stat label="Accepted" value={job.accepted_count ?? "—"} />
                <Stat label="Rejected" value={job.rejected_count ?? "—"} />
              </div>
            )}

            {/* Item preview */}
            {job?.status === "done" && job.image && (
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <img src={job.image} alt={job.name ?? ""} className="w-full h-48 object-cover" />
              </div>
            )}

            {/* Action buttons */}
            {isTerminal && (
              <button
                onClick={onDone}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                {job?.status === "done" ? "Done" : "Close"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center bg-gray-50 rounded-lg py-3">
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
