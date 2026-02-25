const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface Item {
  id: number;
  uid: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity: number;
  available: boolean;
  location: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Compartment {
  id: number;
  floor: number;
  locker_number: string;
  status: string;
  item_uid: string | null;
  user_uid: string | null;
  occupied_at: string | null;
  due_at: string | null;
}

export interface ItemCreate {
  uid: string;
  name: string;
  description?: string;
  category?: string;
  quantity?: number;
  available?: boolean;
  location?: string;
  image_url?: string | null;
}

// ---------- Items ----------

export async function fetchItems(available?: boolean): Promise<Item[]> {
  const params = new URLSearchParams();
  if (available !== undefined) params.set("available", String(available));
  const url = params.toString() ? `${API_BASE}/api/items/?${params}` : `${API_BASE}/api/items/`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
}

export async function fetchItemByUid(uid: string): Promise<Item> {
  const res = await fetch(`${API_BASE}/api/items/${uid}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Item not found");
  return res.json();
}

export async function createItem(item: ItemCreate): Promise<Item> {
  const res = await fetch(`${API_BASE}/api/items/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create item");
  }
  return res.json();
}

export async function updateItem(uid: string, item: ItemCreate): Promise<Item> {
  const res = await fetch(`${API_BASE}/api/items/${uid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update item");
  }
  return res.json();
}

export async function deleteItem(uid: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/items/${uid}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete item");
}

export async function uploadItemImage(uid: string, file: File): Promise<Item> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/items/${uid}/upload-image`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload image");
  return res.json();
}

// ---------- Compartments ----------

export async function fetchCompartments(floor?: number): Promise<Compartment[]> {
  const params = new URLSearchParams();
  if (floor !== undefined) params.set("floor", String(floor));
  const url = params.toString() ? `${API_BASE}/api/compartments/?${params}` : `${API_BASE}/api/compartments/`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch compartments");
  return res.json();
}

export async function fetchCompartmentItems(
  lockerNumber: string,
  availableOnly = false
): Promise<Item[]> {
  const params = new URLSearchParams();
  if (availableOnly) params.set("available_only", "true");
  const fetchUrl = params.toString()
    ? `${API_BASE}/api/compartments/${lockerNumber}/items/?${params}`
    : `${API_BASE}/api/compartments/${lockerNumber}/items/`;
  const res = await fetch(fetchUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch compartment items");
  return res.json();
}

export async function fetchFloorItems(
  floor: number,
  availableOnly = false
): Promise<Item[]> {
  const params = new URLSearchParams();
  if (availableOnly) params.set("available_only", "true");
  const fetchUrl = params.toString()
    ? `${API_BASE}/api/compartments/floor/${floor}/items/?${params}`
    : `${API_BASE}/api/compartments/floor/${floor}/items/`;
  const res = await fetch(fetchUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch floor items");
  return res.json();
}

// ---------- Helpers ----------

/**
 * Fetch a presigned URL for an item image from the backend.
 * Returns "/placeholder.png" when the item has no image.
 */
export async function fetchImageUrl(uid: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/items/${uid}/image-url`, {
      cache: "no-store",
    });
    if (!res.ok) return "/placeholder.png";
    const data = await res.json();
    return data.url;
  } catch {
    return "/placeholder.png";
  }
}

/**
 * Synchronous helper kept for backward compatibility.
 * - null / empty  → placeholder
 * - starts with "http" → already a presigned or external URL
 * - otherwise → legacy path (prepend API_BASE)
 */
export function getImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return "/placeholder.png";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${API_BASE}${imageUrl}`;
}

// ---------- Auth ----------

export interface AuthUser {
  id: number;
  uid: string;
  name: string;
  email: string | null;
  role: string;
  authorized: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
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

/** Helper: get auth header for admin requests */
export function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** Overwrite createItem / deleteItem / uploadItemImage to include auth */
export async function createItemAuth(item: ItemCreate): Promise<Item> {
  const res = await fetch(`${API_BASE}/api/items/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create item");
  }
  return res.json();
}

export async function deleteItemAuth(uid: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/items/${uid}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to delete item" }));
    throw new Error(err.detail || "Failed to delete item");
  }
}

export async function uploadItemImageAuth(uid: string, file: File): Promise<Item> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/items/${uid}/upload-image`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload image");
  return res.json();
}
