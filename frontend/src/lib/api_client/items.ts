import {
  API_BASE,
  authHeaders,
  fetchItemTypeById,
  fetchItemTypes,
  mapItemTypeToItem,
  parseItemTypeId,
  pickPrimaryImage,
} from "./core";
import { Item, ItemCreate, ItemTypeApi } from "./types";

export async function fetchItems(available?: boolean): Promise<Item[]> {
  const itemTypes = await fetchItemTypes();
  const mapped = itemTypes.map(mapItemTypeToItem);
  if (available === undefined) return mapped;
  return mapped.filter((item) => item.available === available);
}

export async function fetchItemByUid(uid: string): Promise<Item> {
  const itemTypeId = parseItemTypeId(uid);
  try {
    const itemType = await fetchItemTypeById(itemTypeId);
    return mapItemTypeToItem(itemType);
  } catch {
    throw new Error("Item not found");
  }
}

export async function createItem(item: ItemCreate): Promise<Item> {
  const name = item.name?.trim() || item.uid?.trim();
  if (!name) throw new Error("Item name is required");

  const res = await fetch(`${API_BASE}/api/item-types`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to create item" }));
    throw new Error(err.detail || "Failed to create item");
  }
  const created: ItemTypeApi = await res.json();
  return mapItemTypeToItem(created);
}

export async function updateItem(uid: string, item: ItemCreate): Promise<Item> {
  const itemTypeId = parseItemTypeId(uid);
  const payload: Record<string, unknown> = {};
  if (item.name) payload.name = item.name;
  if (item.available !== undefined) payload.active = item.available;

  const res = await fetch(`${API_BASE}/api/item-types/${itemTypeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to update item" }));
    throw new Error(err.detail || "Failed to update item");
  }
  const updated: ItemTypeApi = await res.json();
  return mapItemTypeToItem(updated);
}

export async function deleteItem(uid: string): Promise<void> {
  const itemTypeId = parseItemTypeId(uid);
  const res = await fetch(`${API_BASE}/api/item-types/${itemTypeId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete item");
}

export async function uploadItemImage(uid: string, file: File): Promise<Item> {
  const itemTypeId = parseItemTypeId(uid);
  const formData = new FormData();
  formData.append("image_file", file);

  const res = await fetch(`${API_BASE}/api/item-types/${itemTypeId}/images`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to upload item image" }));
    throw new Error(err.detail || "Failed to upload item image");
  }

  const updated: ItemTypeApi = await res.json();
  return mapItemTypeToItem(updated);
}

export async function fetchImageUrl(uid: string): Promise<string> {
  try {
    const itemTypeId = parseItemTypeId(uid);
    const data = await fetchItemTypeById(itemTypeId);
    return pickPrimaryImage(data.images) || "/placeholder.png";
  } catch {
    return "/placeholder.png";
  }
}

export function getImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return "/placeholder.png";
  if (imageUrl.startsWith("http")) return imageUrl;

  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${base}${path}`;
}

export async function createItemAuth(item: ItemCreate): Promise<Item> {
  const name = item.name?.trim() || item.uid?.trim();
  if (!name) throw new Error("Item name is required");

  const res = await fetch(`${API_BASE}/api/item-types`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to create item" }));
    throw new Error(err.detail || "Failed to create item");
  }
  const created: ItemTypeApi = await res.json();
  return mapItemTypeToItem(created);
}

export async function deleteItemAuth(uid: string): Promise<void> {
  const itemTypeId = parseItemTypeId(uid);
  const res = await fetch(`${API_BASE}/api/item-types/${itemTypeId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to delete item" }));
    throw new Error(err.detail || "Failed to delete item");
  }
}

export async function uploadItemImageAuth(uid: string, file: File): Promise<Item> {
  const itemTypeId = parseItemTypeId(uid);
  const formData = new FormData();
  formData.append("image_file", file);

  const res = await fetch(`${API_BASE}/api/item-types/${itemTypeId}/images`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to upload item image" }));
    throw new Error(err.detail || "Failed to upload item image");
  }

  const updated: ItemTypeApi = await res.json();
  return mapItemTypeToItem(updated);
}
