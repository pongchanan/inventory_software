/**
 * API client for the inventory backend.
 *
 * All requests use relative paths (/api/...) so they go to the same origin.
 * In production, the catch-all route handler at /api/[...path]/route.ts
 * proxies them to the backend via BACKEND_URL (Railway internal network).
 * Locally, the same proxy forwards to http://localhost:3000.
 */

export const API_BASE = "";

interface ItemTypeImageApi {
    id: number;
    item_type_id: number;
    image_url: string;
    is_primary: boolean;
    created_at: string;
}

interface ItemTypeApi {
    id: number;
    name: string;
    active: boolean;
    created_at: string;
    updated_at: string;
    images?: ItemTypeImageApi[];
}

interface InventoryEventApi {
    id: number;
    session_id: number;
    user_id: number;
    item_type_id: number;
    event_type: string;
    quantity: number;
    location_id: number | null;
    observation_id: number | null;
    note: string | null;
    created_at: string;
}

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

function toItemUid(itemTypeId: number): string {
    return `TYPE-${itemTypeId}`;
}

function parseItemTypeId(uid: string): number {
    const match = /^TYPE-(\d+)$/i.exec(uid.trim());
    if (!match) {
        throw new Error("Invalid item UID format. Expected TYPE-{id}");
    }
    return Number(match[1]);
}

function pickPrimaryImage(images: ItemTypeImageApi[] = []): string | null {
    if (!images.length) return null;
    const primary = images.find((img) => img.is_primary) ?? images[0];
    return primary?.image_url ?? null;
}

function mapItemTypeToItem(itemType: ItemTypeApi): Item {
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

async function fetchItemTypes(): Promise<ItemTypeApi[]> {
    const res = await fetch(`${API_BASE}/api/item-types`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch item types");
    return res.json();
}

async function fetchInventoryEvents(): Promise<InventoryEventApi[]> {
    const res = await fetch(`${API_BASE}/api/inventory/events`, {
        cache: "no-store",
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch inventory events");
    return res.json();
}

// ---------- Items ----------

export async function fetchItems(available?: boolean): Promise<Item[]> {
    const itemTypes = await fetchItemTypes();
    const mapped = itemTypes.map(mapItemTypeToItem);
    if (available === undefined) return mapped;
    return mapped.filter((item) => item.available === available);
}

export async function fetchItemByUid(uid: string): Promise<Item> {
    const itemTypeId = parseItemTypeId(uid);
    const res = await fetch(`${API_BASE}/api/item-types/${itemTypeId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Item not found");
    const itemType: ItemTypeApi = await res.json();
    return mapItemTypeToItem(itemType);
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
        const err = await res.json();
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
        const err = await res.json();
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
    void uid;
    void file;
    throw new Error("Image upload is not supported on /api/item-types yet");
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

// ---------- Loans ----------

export interface Loan {
    id: number;
    user_uid: string;
    item_uid: string;
    borrowed_at: string;
    due_at: string;
    returned_at: string | null;
    status: string; // active, returned, overdue
}

export interface LoanCreate {
    user_uid: string;
    item_uid: string;
    due_at: string;
}

export async function fetchActiveLoans(userUid?: string): Promise<Loan[]> {
    const all = await fetchActiveLoanDetails();
    const filtered = userUid ? all.filter((loan) => loan.user_uid === userUid) : all;
    return filtered.map((loan) => ({
        id: loan.id,
        user_uid: loan.user_uid,
        item_uid: loan.item_uid,
        borrowed_at: loan.borrowed_at,
        due_at: loan.due_at,
        returned_at: loan.returned_at,
        status: loan.status,
    }));
}

export async function fetchOverdueLoans(): Promise<Loan[]> {
    const all = await fetchActiveLoanDetails();
    return all
        .filter((loan) => loan.status === "overdue")
        .map((loan) => ({
            id: loan.id,
            user_uid: loan.user_uid,
            item_uid: loan.item_uid,
            borrowed_at: loan.borrowed_at,
            due_at: loan.due_at,
            returned_at: loan.returned_at,
            status: loan.status,
        }));
}

export async function fetchAllLoans(statusFilter?: string): Promise<Loan[]> {
    const all = await fetchLoanDetails(statusFilter);
    return all.map((loan) => ({
        id: loan.id,
        user_uid: loan.user_uid,
        item_uid: loan.item_uid,
        borrowed_at: loan.borrowed_at,
        due_at: loan.due_at,
        returned_at: loan.returned_at,
        status: loan.status,
    }));
}

export async function fetchUserLoans(
    userUid: string,
    includeReturned = false
): Promise<Loan[]> {
    const details = await fetchUserLoanDetails(userUid, includeReturned);
    return details.map((loan) => ({
        id: loan.id,
        user_uid: loan.user_uid,
        item_uid: loan.item_uid,
        borrowed_at: loan.borrowed_at,
        due_at: loan.due_at,
        returned_at: loan.returned_at,
        status: loan.status,
    }));
}

export async function createLoan(loan: LoanCreate): Promise<Loan> {
    void loan;
    throw new Error("Loan creation moved to /api/inventory/events and requires session_id/user_id/item_type_id");
}

export async function returnLoan(loanId: number): Promise<Loan> {
    void loanId;
    throw new Error("Loan return moved to /api/inventory/events and requires session context");
}

// ---------- Users (admin) ----------

export async function fetchUsers(): Promise<AuthUser[]> {
    const res = await fetch(`${API_BASE}/api/users/`, {
        cache: "no-store",
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
}

// ---------- Helpers ----------

/**
 * Fetch a presigned URL for an item image from the backend.
 * Returns "/placeholder.png" when the item has no image.
 */
export async function fetchImageUrl(uid: string): Promise<string> {
    try {
        const itemTypeId = parseItemTypeId(uid);
        const res = await fetch(`${API_BASE}/api/item-types/${itemTypeId}`, {
            cache: "no-store",
        });
        if (!res.ok) return "/placeholder.png";
        const data: ItemTypeApi = await res.json();
        return pickPrimaryImage(data.images) || "/placeholder.png";
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

    const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${base}${path}`;
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
    const name = item.name?.trim() || item.uid?.trim();
    if (!name) throw new Error("Item name is required");

    const res = await fetch(`${API_BASE}/api/item-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name }),
    });
    if (!res.ok) {
        const err = await res.json();
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
    void uid;
    void file;
    throw new Error("Image upload is not supported on /api/item-types yet");
}

// ---------- Loans ----------

export interface LoanDetail {
    id: number;
    user_uid: string;
    user_name: string;
    user_email: string | null;
    item_uid: string;
    item_name: string;
    item_category: string | null;
    item_image_url: string | null;
    borrowed_at: string;
    due_at: string;
    returned_at: string | null;
    status: string;
}

function addDays(isoDate: string, days: number): string {
    const date = new Date(isoDate);
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

function normalizeLoanStatus(returnedAt: string | null, dueAt: string): string {
    if (returnedAt) return "returned";
    return new Date(dueAt) < new Date() ? "overdue" : "active";
}

async function buildLoanDetails(): Promise<LoanDetail[]> {
    const [events, users, itemTypes] = await Promise.all([
        fetchInventoryEvents(),
        fetchUsers().catch(() => [] as AuthUser[]),
        fetchItemTypes(),
    ]);

    const usersById = new Map<number, AuthUser>(users.map((u) => [u.id, u]));
    const itemTypesById = new Map<number, ItemTypeApi>(itemTypes.map((i) => [i.id, i]));

    const sorted = [...events].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    type BorrowSlot = { borrowed_at: string; source_event_id: number };
    const activeByKey = new Map<string, BorrowSlot[]>();
    const result: LoanDetail[] = [];
    let syntheticId = 1;

    for (const ev of sorted) {
        const type = ev.event_type?.toLowerCase();
        if (type !== "borrow" && type !== "return") continue;
        const quantity = Math.max(1, Number(ev.quantity) || 1);
        const key = `${ev.user_id}:${ev.item_type_id}`;
        const stack = activeByKey.get(key) ?? [];

        if (type === "borrow") {
            for (let i = 0; i < quantity; i += 1) {
                stack.push({ borrowed_at: ev.created_at, source_event_id: ev.id });
            }
            activeByKey.set(key, stack);
            continue;
        }

        for (let i = 0; i < quantity; i += 1) {
            const borrowed = stack.shift();
            if (!borrowed) break;

            const user = usersById.get(ev.user_id);
            const itemType = itemTypesById.get(ev.item_type_id);
            const dueAt = addDays(borrowed.borrowed_at, 7);

            result.push({
                id: syntheticId++,
                user_uid: user?.uid ?? String(ev.user_id),
                user_name: user?.name ?? `User ${ev.user_id}`,
                user_email: user?.email ?? null,
                item_uid: toItemUid(ev.item_type_id),
                item_name: itemType?.name ?? `Item Type ${ev.item_type_id}`,
                item_category: "item-type",
                item_image_url: pickPrimaryImage(itemType?.images),
                borrowed_at: borrowed.borrowed_at,
                due_at: dueAt,
                returned_at: ev.created_at,
                status: "returned",
            });
        }

        activeByKey.set(key, stack);
    }

    for (const [key, stack] of activeByKey.entries()) {
        const [userIdText, itemTypeIdText] = key.split(":");
        const userId = Number(userIdText);
        const itemTypeId = Number(itemTypeIdText);
        const user = usersById.get(userId);
        const itemType = itemTypesById.get(itemTypeId);

        for (const borrow of stack) {
            const dueAt = addDays(borrow.borrowed_at, 7);
            result.push({
                id: syntheticId++,
                user_uid: user?.uid ?? String(userId),
                user_name: user?.name ?? `User ${userId}`,
                user_email: user?.email ?? null,
                item_uid: toItemUid(itemTypeId),
                item_name: itemType?.name ?? `Item Type ${itemTypeId}`,
                item_category: "item-type",
                item_image_url: pickPrimaryImage(itemType?.images),
                borrowed_at: borrow.borrowed_at,
                due_at: dueAt,
                returned_at: null,
                status: normalizeLoanStatus(null, dueAt),
            });
        }
    }

    return result.sort(
        (a, b) => new Date(b.borrowed_at).getTime() - new Date(a.borrowed_at).getTime()
    );
}

export async function fetchLoanDetails(statusFilter?: string): Promise<LoanDetail[]> {
    const details = await buildLoanDetails();
    if (!statusFilter) return details;
    return details.filter((loan) => loan.status === statusFilter);
}

export async function fetchActiveLoanDetails(): Promise<LoanDetail[]> {
    const details = await buildLoanDetails();
    return details.filter((loan) => loan.status === "active" || loan.status === "overdue");
}

export async function fetchUserLoanDetails(
    userUid: string,
    includeReturned = true
): Promise<LoanDetail[]> {
    const details = await buildLoanDetails();
    const mine = details.filter((loan) => loan.user_uid === userUid);
    if (includeReturned) return mine;
    return mine.filter((loan) => loan.status !== "returned");
}

// ---------- Audit Logs ----------

export interface AuditLogDetail {
    id: number;
    timestamp: string;
    type: string;
    user: string;
    user_name: string | null;
    item: string | null;
    status: string;
    message: string;
    ip_address: string | null;
}

export async function fetchCabinetAccessLogs(hours: number = 24): Promise<AuditLogDetail[]> {
    const res = await fetch(`${API_BASE}/api/audit-logs/cabinet-access/recent?hours=${hours}`, {
        cache: "no-store",
        headers: authHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch cabinet access logs");
    return res.json();
}
