import { API_BASE, authHeaders } from "./core";
import { AuthUser, LoginResponse } from "./types";

export async function fetchUsers(): Promise<AuthUser[]> {
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

  return rows.map((r) => ({
    id: r.id,
    uid: r.nfc_card_uid,
    name: r.name,
    email: r.email,
    role: r.role,
    authorized: r.active,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}
