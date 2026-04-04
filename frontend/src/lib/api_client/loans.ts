import {
  fetchInventoryEvents,
  fetchItemTypes,
  pickPrimaryImage,
  toItemUid,
} from "./core";
import { fetchUsers } from "./auth";
import { Loan, LoanCreate, LoanDetail } from "./types";

// Cache for loan details to prevent redundant API calls
let loanDetailsCache: LoanDetail[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function clearLoanCache() {
  loanDetailsCache = null;
  cacheTimestamp = 0;
}

function isCacheValid(): boolean {
  return loanDetailsCache !== null && Date.now() - cacheTimestamp < CACHE_TTL;
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
  // Return cached results if still valid
  if (isCacheValid()) {
    console.log("buildLoanDetails: Returning cached results");
    return loanDetailsCache!;
  }

  console.log("buildLoanDetails: Cache miss, fetching fresh data...");
  
  try {
    console.log("buildLoanDetails: Requesting events, users, and item types...");

    // Fetch in parallel but make users optional (in case it fails)
    const [events, itemTypes] = await Promise.all([
      (async () => {
        console.log("buildLoanDetails: Fetching events...");
        const result = await fetchInventoryEvents();
        console.log("buildLoanDetails: Events received:", result.length);
        return result;
      })(),
      (async () => {
        console.log("buildLoanDetails: Fetching item types...");
        const result = await fetchItemTypes();
        console.log("buildLoanDetails: Item types received:", result.length);
        return result;
      })(),
    ]);

    // Try to fetch users but don't fail if it errors
    let users: any[] = [];
    try {
      console.log("buildLoanDetails: Fetching users...");
      users = await fetchUsers();
      console.log("buildLoanDetails: Users received:", users.length);
    } catch (userError) {
      console.warn("buildLoanDetails: Failed to fetch users, continuing without user info:", userError);
      users = [];
    }

    console.log("buildLoanDetails: All data received, creating maps...");
    const usersById = new Map(users.map((u) => [u.id, u]));
    const itemTypesById = new Map(itemTypes.map((i) => [i.id, i]));
    console.log("buildLoanDetails: Maps created, processing events...");

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

    // Cache the results before returning
    console.log("buildLoanDetails: Building sorted result...");
    const sortedResult = result.sort(
      (a, b) => new Date(b.borrowed_at).getTime() - new Date(a.borrowed_at).getTime()
    );
    console.log("buildLoanDetails: Caching results...");
    loanDetailsCache = sortedResult;
    cacheTimestamp = Date.now();
    console.log("buildLoanDetails: Complete! Returning", sortedResult.length, "loans");
    return sortedResult;
  } catch (error) {
    console.error("buildLoanDetails: Error occurred:", error);
    throw error;
  }
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
  console.log("fetchUserLoanDetails: Starting for user", userUid);
  
  // Fast path: use cached buildLoanDetails which has the sorting and filtering logic
  const details = await buildLoanDetails();
  console.log("fetchUserLoanDetails: Got", details.length, "total loans, filtering for user", userUid);
  
  const mine = details.filter((loan) => loan.user_uid === userUid);
  console.log("fetchUserLoanDetails: User has", mine.length, "loans");
  
  if (includeReturned) {
    console.log("fetchUserLoanDetails: Returning", mine.length, "loans (including returned)");
    return mine;
  }
  
  const filtered = mine.filter((loan) => loan.status !== "returned");
  console.log("fetchUserLoanDetails: Returning", filtered.length, "loans (excluding returned)");
  return filtered;
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
  throw new Error("Loan creation uses /api/inventory/events with session_id, user_id, item_type_id");
}

export async function returnLoan(loanId: number): Promise<Loan> {
  void loanId;
  throw new Error("Loan return uses /api/inventory/events with event_type=return and session context");
}

// Export cache control function for manual cache invalidation
export { clearLoanCache };
