import { API_BASE, authHeaders } from "./core";
import { AuthUser, LoginResponse } from "./types";

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

  return rows.map(normalizeAuthUser);
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
  const payload: {
    access_token: string;
    token_type: string;
    user: {
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
    };
  } = await res.json();

  return {
    access_token: payload.access_token,
    token_type: payload.token_type,
    user: normalizeAuthUser(payload.user),
  };
}

export async function register(name: string, email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(err.detail || "Registration failed");
  }
  const payload: {
    access_token: string;
    token_type: string;
    user: {
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
    };
  } = await res.json();

  return {
    access_token: payload.access_token,
    token_type: payload.token_type,
    user: normalizeAuthUser(payload.user),
  };
}

export async function fetchMe(token?: string): Promise<AuthUser> {
  // If no token provided, get it from localStorage
  let authToken = token;
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem('access_token') || '';
  }
  
  if (!authToken) {
    throw new Error("Not authenticated");
  }
  
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) throw new Error("Not authenticated");
  const payload: {
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
  } = await res.json();
  return normalizeAuthUser(payload);
}

export async function linkNFCCard(nfc_card_uid: string, token?: string): Promise<AuthUser> {
  // If no token provided, get it from localStorage
  let authToken = token;
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem('access_token') || '';
  }
  
  if (!authToken) {
    throw new Error("Not authenticated");
  }
  
  const res = await fetch(`${API_BASE}/api/auth/link-nfc-card`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nfc_card_uid }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to link NFC card" }));
    throw new Error(err.detail || "Failed to link NFC card");
  }
  const payload: {
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
  } = await res.json();
  return normalizeAuthUser(payload);
}
