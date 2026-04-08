// ── User ──
export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  card_id: string | null;
  is_blacklist: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ── Items ──
export interface Item {
  id: number;
  name: string;
  quantity: number;
  is_active: boolean;
  image: string | null;
  enroll_status: "processing" | "done" | "failed" | null;
}

export interface PaginatedItems {
  items: Item[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ── Borrowings ──
export interface BorrowingUser {
  id: number;
  name: string;
  email: string | null;
  card_id: string | null;
}

export interface BorrowingItem {
  id: number;
  name: string;
  image_path: string | null;
  image_url: string | null;
}

export interface Borrowing {
  id: number;
  item_id: number;
  user_id: number;
  borrow_at: string;
  due_at: string;
  return_at: string | null;
  user: BorrowingUser;
  item: BorrowingItem;
}

export interface PaginatedBorrowings {
  borrowings: Borrowing[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PopularItem {
  item_id: number;
  name: string;
  image_path: string | null;
  borrow_count: number;
}

export interface PaginatedPopularItems {
  items: PopularItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ── Damaged Reports ──
export interface DamagedReport {
  id: number;
  topic: string;
  description: string;
  item_id: number;
  item: {
    id: number;
    name: string;
    image_path: string | null;
    image_url: string | null;
  };
  report_at: string;
  report_by: number;
  user: BorrowingUser;
  illustrated_path: string;
  illustrated_url: string;
  approved: boolean;
  approved_by: number | null;
  admin_comment: string | null;
}

// ── Sessions ──
export interface Session {
  id: number;
  open_by: number;
  open_at: string;
  close_at: string | null;
  close_image_path: string | null;
  user: User;
}

export interface PaginatedSessions {
  sessions: Session[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ── Activity Log ──
export interface ActivityEvent {
  event_type: string;
  timestamp: string;
  reference_id: number;
  user_id: number | null;
  user_name: string | null;
  item_id: number | null;
  item_name: string | null;
  detail: string | null;
}

// ── Enroll Job ──
export interface EnrollJob {
  job_id: string;
  status: "pending" | "running" | "done" | "failed";
  item_id: number;
  name: string | null;
  quantity: number | null;
  is_active: boolean | null;
  image: string | null;
  accepted_count: number | null;
  rejected_count: number | null;
  frames_sampled: number | null;
  error: string | null;
}
