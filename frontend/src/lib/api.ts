/**
 * Canonical API client for v2 backend routes.
 * All requests go through the Next.js proxy route at /api/[...path].
 */

export { API_BASE, authHeaders } from "./api_client/core";
export type {
  AuditLogDetail,
  AuthUser,
  Compartment,
  Item,
  ItemCreate,
  Loan,
  LoanCreate,
  LoanDetail,
  LoginResponse,
} from "./api_client/types";

export { fetchCabinetAccessLogs } from "./api_client/audit";
export { fetchMe, fetchUsers, login } from "./api_client/auth";
export {
  fetchCompartmentItems,
  fetchCompartments,
  fetchFloorItems,
} from "./api_client/compartments";
export {
  createItem,
  createItemAuth,
  deleteItem,
  deleteItemAuth,
  fetchImageUrl,
  fetchItemByUid,
  fetchItems,
  getImageUrl,
  updateItem,
  uploadItemImage,
  uploadItemImageAuth,
} from "./api_client/items";
export {
  createLoan,
  fetchActiveLoanDetails,
  fetchActiveLoans,
  fetchAllLoans,
  fetchLoanDetails,
  fetchOverdueLoans,
  fetchUserLoanDetails,
  fetchUserLoans,
  returnLoan,
} from "./api_client/loans";
