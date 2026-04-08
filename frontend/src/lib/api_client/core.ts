import {
  InventoryEventApi,
  Item,
  ItemTypeApi,
  ItemTypeImageApi,
  SlotOccupancyApi,
  StorageLocationApi,
  StorageUnitApi,
} from "./types";

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");


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
    quantity: itemType.quantity ?? 0,
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

function _mapRawItemToItemTypeApi(item: any): ItemTypeApi {
  return {
    id: item.id,
    name: item.name,
    active: item.is_active,
    quantity: item.quantity ?? 0,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString(),
    images: item.image
      ? [
          {
            id: 0,
            item_type_id: item.id,
            image_url: item.image,
            is_primary: true,
            created_at: new Date().toISOString(),
          },
        ]
      : [],
  };
}

export async function fetchItemTypes(): Promise<ItemTypeApi[]> {
  const res = await fetch(`${API_BASE}/api/items/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch item types");
  const data = await res.json();
  return (data.items || []).map(_mapRawItemToItemTypeApi);
}

export interface PaginatedItemTypes {
  items: ItemTypeApi[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function fetchItemTypesPaginated(
  page = 1,
  page_size = 20
): Promise<PaginatedItemTypes> {
  const res = await fetch(
    `${API_BASE}/api/items/?page=${page}&page_size=${page_size}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch item types");
  const data = await res.json();
  return {
    items: (data.items || []).map(_mapRawItemToItemTypeApi),
    total: data.total ?? 0,
    page: data.page ?? page,
    page_size: data.page_size ?? page_size,
    total_pages: data.total_pages ?? 1,
  };
}

export async function searchItemTypes(query: string): Promise<ItemTypeApi[]> {
  if (!query || query.trim().length < 2) return [];
  const encoded = encodeURIComponent(query.trim());
  const res = await fetch(
    `${API_BASE}/api/items/?search=${encoded}&page=1&page_size=10`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to search items");
  const data = await res.json();
  return (data.items || []).map(_mapRawItemToItemTypeApi);
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

function _borrowingToEvents(borrowing: any): InventoryEventApi[] {
  const events: InventoryEventApi[] = [
    {
      id: borrowing.id * 2 - 1,
      session_id: 0,
      user_id: borrowing.user_id,
      item_type_id: borrowing.item_id,
      event_type: "borrow",
      quantity: 1,
      location_id: null,
      observation_id: null,
      note: null,
      created_at: borrowing.borrow_at,
    },
  ];
  if (borrowing.return_at) {
    events.push({
      id: borrowing.id * 2,
      session_id: 0,
      user_id: borrowing.user_id,
      item_type_id: borrowing.item_id,
      event_type: "return",
      quantity: 1,
      location_id: null,
      observation_id: null,
      note: null,
      created_at: borrowing.return_at,
    });
  }
  return events;
}

export async function fetchInventoryEvents(): Promise<InventoryEventApi[]> {
  try {
    const PAGE_SIZE = 100;
    // Fetch page 1 to discover total_pages
    const firstRes = await fetch(
      `${API_BASE}/api/borrowings/me?page=1&page_size=${PAGE_SIZE}`,
      { headers: authHeaders() }
    );
    if (!firstRes.ok) return [];
    const firstData = await firstRes.json();
    if (!Array.isArray(firstData.borrowings)) return [];

    const totalPages: number = firstData.total_pages || 1;
    const allBorrowings = [...firstData.borrowings];

    // Fetch remaining pages in parallel
    if (totalPages > 1) {
      const pageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
      const results = await Promise.all(
        pageNumbers.map((p) =>
          fetch(`${API_BASE}/api/borrowings/me?page=${p}&page_size=${PAGE_SIZE}`, {
            headers: authHeaders(),
          }).then((r) => (r.ok ? r.json() : null))
        )
      );
      for (const data of results) {
        if (data?.borrowings && Array.isArray(data.borrowings)) {
          allBorrowings.push(...data.borrowings);
        }
      }
    }

    return allBorrowings.flatMap(_borrowingToEvents);
  } catch (error) {
    console.error("fetchInventoryEvents: error fetching from backend", error);
    return [];
  }
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