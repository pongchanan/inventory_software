import {
  InventoryEventApi,
  Item,
  ItemTypeApi,
  ItemTypeImageApi,
  SlotOccupancyApi,
  StorageLocationApi,
  StorageUnitApi,
} from "./types";

export const API_BASE = "http://localhost:3000";

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
  const res = await fetch(`${API_BASE}/api/items/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch item types");
  const data = await res.json();
  // Convert paginated items response to ItemTypeApi array
  return (data.items || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    active: item.is_active,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString(),
    images: item.image_path ? [{
      id: 0,
      item_type_id: item.id,
      image_url: item.image_path,
      is_primary: true,
      created_at: new Date().toISOString()
    }] : []
  }));
}

export async function fetchItemTypeById(itemTypeId: number): Promise<ItemTypeApi> {
  // Fetch all items and find by ID (GET /api/item-types/{id} not implemented)
  const items = await fetchItemTypes();
  const item = items.find(i => i.id === itemTypeId);
  if (!item) throw new Error("Item type not found");
  return item;
}

export async function fetchStorageUnits(): Promise<StorageUnitApi[]> {
  // TODO: /api/storage/units endpoint not yet implemented in backend
  console.warn("fetchStorageUnits: endpoint not implemented in backend");
  return [];
}

export async function fetchLocationsByUnit(unitId: number): Promise<StorageLocationApi[]> {
  // TODO: /api/storage/units/{unit_id}/locations endpoint not yet implemented in backend
  console.warn("fetchLocationsByUnit: endpoint not implemented in backend");
  return [];
}

export async function fetchInventoryEvents(): Promise<InventoryEventApi[]> {
  // TODO: /api/inventory/events endpoint not yet implemented in backend
  // Returning empty array for now
  console.warn("fetchInventoryEvents: endpoint not implemented in backend");
  return [];
}

export async function fetchOccupancyByLocation(locationId: number): Promise<SlotOccupancyApi> {
  // TODO: /api/inventory/occupancy/location/{location_id} endpoint not yet implemented in backend
  console.warn("fetchOccupancyByLocation: endpoint not implemented in backend");
  throw new Error("Storage location not found");
}

export async function fetchOccupancyByUnit(unitId: number): Promise<SlotOccupancyApi[]> {
  // TODO: /api/inventory/occupancy/unit/{unit_id} endpoint not yet implemented in backend
  console.warn("fetchOccupancyByUnit: endpoint not implemented in backend");
  return [];
}