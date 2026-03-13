import { API_BASE, authHeaders } from "./core";
import { AuditLogDetail } from "./types";

export async function fetchCabinetAccessLogs(hours = 24): Promise<AuditLogDetail[]> {
  const res = await fetch(`${API_BASE}/api/audit-logs/cabinet-access/recent?hours=${hours}`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch cabinet access logs");
  return res.json();
}
