import { API_BASE, authHeaders } from "./core";

export interface BorrowingRecord {
  id: number;
  user_id: number;
  item_id: number;
  item_name?: string;
  item_uid?: string;
  borrow_at: string;
  due_at?: string;
  return_at?: string | null;
  status?: string;
}

// Get current user's active borrowings
export async function fetchMyBorrowings(page = 1, pageSize = 20): Promise<BorrowingRecord[]> {
  const res = await fetch(`${API_BASE}/api/borrowings/me?page=${page}&page_size=${pageSize}`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch my borrowings");
  const data = await res.json();
  return (data.borrowings || data.items || []);
}

// Get a specific user's active borrowings (admin only)
export async function fetchUserBorrowings(userId: number, page = 1, pageSize = 20): Promise<BorrowingRecord[]> {
  const res = await fetch(`${API_BASE}/api/borrowings/users/${userId}?page=${page}&page_size=${pageSize}`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch user borrowings");
  const data = await res.json();
  return (data.borrowings || data.items || []);
}
