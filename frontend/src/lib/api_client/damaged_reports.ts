import { API_BASE, authHeaders } from "./core";

export interface DamagedItemReportOut {
  id: number;
  user_id: number;
  item_id: number;
  topic: string;
  description: string;
  image_key: string;
  status: string;
  created_at: string;
  admin_comment?: string;
}

/**
 * Submit a damage report for the user's current active borrowing
 * @param topic - The category/type of damage (e.g., "broken", "missing parts", "malfunction")
 * @param description - Detailed description of the damage
 * @param imageFile - The image file showing the damage
 */
export async function submitDamageReport(
  topic: string,
  description: string,
  imageFile: File
): Promise<DamagedItemReportOut> {
  const formData = new FormData();
  formData.append("topic", topic);
  formData.append("description", description);
  formData.append("image", imageFile);

  const res = await fetch(`${API_BASE}/api/damaged-reports/`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to submit damage report" }));
    throw new Error(error.detail || "Failed to submit damage report");
  }

  return res.json();
}

/**
 * Get current user's damage reports
 */
export async function fetchMyDamageReports(): Promise<DamagedItemReportOut[]> {
  const res = await fetch(`${API_BASE}/api/damaged-reports/me`, {
    cache: "no-store",
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch damage reports");
  return res.json();
}

/**
 * Get all damage reports (admin only)
 */
export async function fetchAllDamageReports(): Promise<DamagedItemReportOut[]> {
  const res = await fetch(`${API_BASE}/api/damaged-reports/`, {
    cache: "no-store",
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch damage reports");
  return res.json();
}

/**
 * Approve a damage report (admin only)
 * @param reportId - The ID of the report to approve
 * @param adminComment - Optional comment from admin
 */
export async function approveDamageReport(
  reportId: number,
  adminComment: string = ""
): Promise<DamagedItemReportOut> {
  const res = await fetch(`${API_BASE}/api/damaged-reports/${reportId}/approve`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ admin_comment: adminComment }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to approve report" }));
    throw new Error(error.detail || "Failed to approve report");
  }

  return res.json();
}
