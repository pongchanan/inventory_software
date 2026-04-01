import { API_BASE, authHeaders } from "./core";
import { AuthUser } from "./types";

function normalizeAuthUser(row: {
  id: number;
  nfc_card_uid?: string;
  uid?: string;
  name: string;
  email: string | null;
  role: string;
  active?: boolean;
  authorized?: boolean;
  created_at: string;
  updated_at: string;
}): AuthUser {
  return {
    id: row.id,
    uid: row.nfc_card_uid ?? row.uid ?? "",
    name: row.name,
    email: row.email,
    role: row.role,
    authorized: row.active ?? row.authorized ?? false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Fetch all users (requires admin role)
 */
export async function getAllUsers(): Promise<AuthUser[]> {
  const res = await fetch(`${API_BASE}/api/users`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  const rows: Array<{
    id: number;
    nfc_card_uid: string;
    name: string;
    email: string | null;
    role: string;
    active: boolean;
    created_at: string;
    updated_at: string;
  }> = await res.json();

  return rows.map(normalizeAuthUser);
}

/**
 * Update a user's role (requires admin role)
 */
export async function updateUserRole(
  userId: number,
  role: "admin" | "user"
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to update user role");
  }

  const row = await res.json();
  return normalizeAuthUser(row);
}
