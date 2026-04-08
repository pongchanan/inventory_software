import {
  API_BASE,
  authHeaders,
  fetchItemTypeById,
  fetchItemTypes,
  fetchItemTypesPaginated,
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

export interface PaginatedItems {
  items: Item[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function fetchItemsPaginated(
  page = 1,
  page_size = 20
): Promise<PaginatedItems> {
  const data = await fetchItemTypesPaginated(page, page_size);
  return {
    items: data.items.map(mapItemTypeToItem),
    total: data.total,
    page: data.page,
    page_size: data.page_size,
    total_pages: data.total_pages,
  };
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
  const itemId = parseItemTypeId(uid);
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_BASE}/api/items/${itemId}/image`, {
    method: "PUT",
    headers: authHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to upload image" }));
    throw new Error(err.detail || "Failed to upload image");
  }

  const data = await res.json();
  // Map the ItemOut response back to the frontend Item type
  return mapItemTypeToItem({
    id: data.id,
    name: data.name,
    active: data.is_active,
    quantity: data.quantity,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: data.image
      ? [{ id: 0, item_type_id: data.id, image_url: data.image, is_primary: true, created_at: new Date().toISOString() }]
      : [],
  });
}

export async function updateItemQuantityAuth(uid: string, newQuantity: number, currentQuantity: number): Promise<void> {
  const itemTypeId = parseItemTypeId(uid);
  const delta = newQuantity - currentQuantity;
  const res = await fetch(`${API_BASE}/api/items/${itemTypeId}/quantity`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ delta }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to update quantity" }));
    throw new Error(err.detail || "Failed to update quantity");
  }
}

export async function enrollItem(
  name: string,
  quantity: number,
  video: File,
  image?: File,
): Promise<ItemEnrollOut> {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("quantity", quantity.toString());
  formData.append("video", video);
  if (image) {
    formData.append("image", image);
  }

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

export async function adjustItemQuantity(itemId: number, delta: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/items/${itemId}/quantity`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ delta }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to update quantity" }));
    throw new Error(err.detail || "Failed to update quantity");
  }
}
