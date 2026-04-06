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

export interface ItemEnrollOut {
  id: number;
  name: string;
  quantity: number;
  is_active: boolean;
  image: string | null;
  accepted_count: number;
  rejected_count: number;
  frames_sampled: number;
}

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
  throw new Error("POST /api/item-types endpoint not yet implemented in backend. Please implement item creation endpoint.");
}

export async function updateItem(uid: string, item: ItemCreate): Promise<Item> {
  throw new Error("PATCH /api/item-types/{id} endpoint not yet implemented in backend. Please implement item update endpoint.");
}

export async function deleteItem(uid: string): Promise<void> {
  throw new Error("DELETE /api/item-types/{id} endpoint not yet implemented in backend. Please implement item delete endpoint.");
}

export async function uploadItemImage(uid: string, file: File): Promise<Item> {
  throw new Error("POST /api/item-types/{id}/images endpoint not yet implemented in backend. Please implement image upload endpoint.");
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
  throw new Error("POST /api/item-types endpoint not yet implemented in backend. Please implement item creation endpoint.");
}

export async function deleteItemAuth(uid: string): Promise<void> {
  throw new Error("DELETE /api/item-types/{id} endpoint not yet implemented in backend. Please implement item delete endpoint.");
}

export async function uploadItemImageAuth(uid: string, file: File): Promise<Item> {
  throw new Error("POST /api/item-types/{id}/images endpoint not yet implemented in backend. Please implement image upload endpoint.");
}

export async function enrollItem(
  name: string,
  quantity: number,
  video: File
): Promise<ItemEnrollOut> {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("quantity", quantity.toString());
  formData.append("video", video);

  const res = await fetch(`${API_BASE}/api/items/enroll`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to enroll item" }));
    throw new Error(err.detail || "Failed to enroll item");
  }

  return await res.json();
}
