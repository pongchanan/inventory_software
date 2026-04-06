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
 * Fetch cabinet access logs from /api/sessions
 * Transforms session data into audit log format
 * Returns 10 latest sessions per page
 */
export async function fetchCabinetAccessLogs(page: number = 1): Promise<{ logs: AuditLogDetail[]; total: number; page: number; page_size: number }> {
  const res = await fetch(`${API_BASE}/api/sessions/?page=${page}&page_size=10`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch cabinet access logs");
  
  const data: PaginatedSessions = await res.json();
  
  // Transform sessions into audit log format, sorted by latest first
  const logs = data.sessions
    .sort((a, b) => new Date(b.open_at).getTime() - new Date(a.open_at).getTime())
    .map(session => ({
      id: session.id,
      timestamp: session.open_at,
      type: "unlock",
      user: session.user.uid,
      user_name: session.user.name,
      item: null,
      status: session.close_at ? "closed" : "open",
      message: `Cabinet ${session.close_at ? "closed" : "opened"} by ${session.user.name}`,
      ip_address: null,
    }));
  
  return {
    logs,
    total: data.total,
    page: data.page,
    page_size: data.page_size,
  };
}
