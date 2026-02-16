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

export function getImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return "/placeholder.png";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${API_BASE}${imageUrl}`;
}
