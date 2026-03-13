import {
  fetchInventoryEvents,
  fetchItemTypes,
  pickPrimaryImage,
  toItemUid,
} from "./core";
import { fetchUsers } from "./auth";
import { Loan, LoanCreate, LoanDetail } from "./types";

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
    fetchUsers().catch(() => []),
    fetchItemTypes(),
  ]);

  const usersById = new Map(users.map((u) => [u.id, u]));
  const itemTypesById = new Map(itemTypes.map((i) => [i.id, i]));

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
