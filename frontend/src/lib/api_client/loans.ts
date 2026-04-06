import {
  API_BASE,
  authHeaders,
} from "./core";
import { fetchUsers } from "./auth";
import { Loan, LoanCreate, LoanDetail } from "./types";

const PAGE_SIZE = 10;

/**
 * Fetch all borrowings for all users (admin view) with pagination
 * Uses single backend endpoint for optimal performance
 * Returns paginated results and total count
 */
export async function fetchAllBorrowings(
  page: number = 1,
  pageSize: number = PAGE_SIZE
): Promise<{ borrowings: LoanDetail[]; total: number; page: number; page_size: number; total_pages: number }> {
  try {
    const response = await fetch(
      `${API_BASE}/api/borrowings/admin/all?page=${page}&page_size=${pageSize}`,
      { headers: authHeaders() }
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch all borrowings");
    }
    
    const data = await response.json();
    
    // Map backend borrowings to LoanDetail format
    const borrowings: LoanDetail[] = data.borrowings.map((borrowing: any) => ({
      id: borrowing.id,
      user_uid: borrowing.user?.uid || `user_${borrowing.user_id}`,
      user_name: borrowing.user?.name || "Unknown",
      user_email: borrowing.user?.email || null,
      item_uid: `item_${borrowing.item_id}`,
      item_name: `Item ${borrowing.item_id}`,
      item_category: "item",
      item_image_url: null,
      borrowed_at: borrowing.borrow_at,
      due_at: borrowing.due_at,
      returned_at: borrowing.return_at,
      status: borrowing.return_at ? "returned" : new Date(borrowing.due_at) < new Date() ? "overdue" : "active",
    }));
    
    return {
      borrowings,
      total: data.total,
      page: data.page,
      page_size: data.page_size,
      total_pages: data.total_pages,
    };
  } catch (error) {
    console.error("Failed to fetch all borrowings:", error);
    return {
      borrowings: [],
      total: 0,
      page,
      page_size: pageSize,
      total_pages: 0,
    };
  }
}

export async function fetchLoanDetails(
  page: number = 1,
  statusFilter?: string
): Promise<{ borrowings: LoanDetail[]; total: number; page: number; total_pages: number }> {
  const result = await fetchAllBorrowings(page, PAGE_SIZE);
  
  if (!statusFilter) {
    return result;
  }

  return {
    ...result,
    borrowings: result.borrowings.filter((loan) => loan.status === statusFilter),
  };
}

export async function fetchActiveLoanDetails(): Promise<LoanDetail[]> {
  const result = await fetchAllBorrowings(1, 100); // Fetch up to 100 items
  return result.borrowings.filter((loan) => loan.status === "active" || loan.status === "overdue");
}


export async function fetchUserLoanDetails(
  userUid: string,
  includeReturned = true
): Promise<LoanDetail[]> {
  const result = await fetchAllBorrowings(1, 100); // Fetch up to 100 items
  const mine = result.borrowings.filter((loan) => loan.user_uid === userUid);
  
  if (includeReturned) {
    return mine;
  }
  
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
  const result = await fetchLoanDetails(1, statusFilter);
  return result.borrowings.map((loan: LoanDetail) => ({
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
