import { API_BASE, authHeaders } from "./core";
import { AuditLogDetail } from "./types";

export interface PaginatedSessions {
  sessions: Array<{
    id: number;
    open_by: number;
    open_at: string;
    close_at: string | null;
    close_image_path: string | null;
    user: {
      id: number;
      uid: string;
      name: string;
      email: string | null;
      role: string;
    };
  }>;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Fetch activity logs from /api/activity-log/
 * Transforms activity log entries into audit log format
 */
export async function fetchCabinetAccessLogs(page: number = 1): Promise<{ logs: AuditLogDetail[]; total: number; page: number; page_size: number }> {
  const res = await fetch(`${API_BASE}/api/activity-log/`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch activity logs");
  
  const entries: Array<{
    event_type: string;
    timestamp: string;
    reference_id: number;
    user_id: number | null;
    user_name: string | null;
    item_id: number | null;
    item_name: string | null;
    detail: string | null;
  }> = await res.json();
  
  // Transform activity log entries into audit log format, sorted by latest first
  const logs = entries
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice((page - 1) * 10, page * 10)
    .map((entry, index) => ({
      // Create unique ID from combination of fields (reference_id + event_type + timestamp + index for stability)
      id: `${entry.reference_id}_${entry.event_type}_${new Date(entry.timestamp).getTime()}_${index}`,
      timestamp: entry.timestamp,
      type: entry.event_type,
      user: entry.user_id?.toString() || "unknown",
      user_name: entry.user_name,
      item: entry.item_name,
      status: entry.event_type.includes("close") || entry.event_type.includes("return") || entry.event_type === "damage_report_approved" ? "completed" : "active",
      message: `${entry.event_type}: ${entry.detail || ""}`,
      ip_address: null,
    }));
  
  return {
    logs,
    total: entries.length,
    page: page,
    page_size: 10,
  };
}
