export interface ItemTypeImageApi {
  id: number;
  item_type_id: number;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface ItemTypeApi {
  id: number;
  name: string;
  quantity: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  images?: ItemTypeImageApi[];
}

export interface StorageUnitApi {
  id: number;
  unit_type: string;
  layout_type: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StorageLocationApi {
  id: number;
  unit_id: number;
  level_no: number;
  row_no: number | null;
  col_no: number | null;
  zone_code: string | null;
  active: boolean;
}

export interface SlotOccupancyApi {
  location_id: number;
  state: string;
  item_type_id: number | null;
  confidence: number | null;
  last_event_id: number | null;
  updated_at?: string | null;
}

export interface InventoryEventApi {
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

export interface Loan {
  id: number;
  user_uid: string;
  item_uid: string;
  borrowed_at: string;
  due_at: string;
  returned_at: string | null;
  status: string;
}

export interface LoanCreate {
  user_uid: string;
  item_uid: string;
  due_at: string;
}

export interface AuthUser {
  id: number;
  uid: string;
  nfc_card_uid?: string;
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

export interface RegistrationOut {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

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

export interface AuditLogDetail {
  id: string | number;
  timestamp: string;
  type: string;
  user: string;
  user_name: string | null;
  item: string | null;
  status: string;
  message: string;
  ip_address: string | null;
}
