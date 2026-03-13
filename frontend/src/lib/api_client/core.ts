import {
  InventoryEventApi,
  Item,
  ItemTypeApi,
  ItemTypeImageApi,
  SlotOccupancyApi,
  StorageLocationApi,
  StorageUnitApi,
} from "./types";

export const API_BASE = "";

export function toItemUid(itemTypeId: number): string {
  return `TYPE-${itemTypeId}`;
}

export function parseItemTypeId(uid: string): number {
  const match = /^TYPE-(\d+)$/i.exec(uid.trim());
  if (!match) {
    throw new Error("Invalid item UID format. Expected TYPE-{id}");
  }
  return Number(match[1]);
}

export function pickPrimaryImage(images: ItemTypeImageApi[] = []): string | null {
  if (!images.length) return null;
  const primary = images.find((img) => img.is_primary) ?? images[0];
  return primary?.image_url ?? null;
}

export function mapItemTypeToItem(itemType: ItemTypeApi): Item {
  return {
    id: itemType.id,
    uid: toItemUid(itemType.id),
    name: itemType.name,
    description: null,
    category: "item-type",
    quantity: 1,
    available: itemType.active,
    location: null,
    image_url: pickPrimaryImage(itemType.images),
    created_at: itemType.created_at,
    updated_at: itemType.updated_at,
  };
}

export function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function fetchItemTypes(): Promise<ItemTypeApi[]> {
  const res = await fetch(`${API_BASE}/api/item-types`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch item types");
  return res.json();
}

export async function fetchItemTypeById(itemTypeId: number): Promise<ItemTypeApi> {
  const res = await fetch(`${API_BASE}/api/item-types/${itemTypeId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Item type not found");
  return res.json();
}

export async function fetchStorageUnits(): Promise<StorageUnitApi[]> {
  const res = await fetch(`${API_BASE}/api/storage/units`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch storage units");
  return res.json();
}

export async function fetchLocationsByUnit(unitId: number): Promise<StorageLocationApi[]> {
  const res = await fetch(`${API_BASE}/api/storage/units/${unitId}/locations`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Storage unit not found");
  return res.json();
}

export async function fetchInventoryEvents(): Promise<InventoryEventApi[]> {
  const res = await fetch(`${API_BASE}/api/inventory/events`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch inventory events");
  return res.json();
}

export async function fetchOccupancyByLocation(locationId: number): Promise<SlotOccupancyApi> {
  const res = await fetch(`${API_BASE}/api/inventory/occupancy/location/${locationId}`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Storage location not found");
  return res.json();
}

export async function fetchOccupancyByUnit(unitId: number): Promise<SlotOccupancyApi[]> {
  const res = await fetch(`${API_BASE}/api/inventory/occupancy/unit/${unitId}`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Storage unit not found");
  return res.json();
}
