/**
 * Canonical API client for v2 backend routes.
 * All requests go through the Next.js proxy route at /api/[...path].
 */

export {
  API_BASE,
  authHeaders,
  fetchLocationsByUnit,
  fetchOccupancyByLocation,
  fetchOccupancyByUnit,
  fetchStorageUnits,
} from "./api_client/core";
export type {
  AuditLogDetail,
  AuthUser,
  Item,
  ItemCreate,
  ItemTypeApi,
  Loan,
  LoanCreate,
  LoanDetail,
  LoginResponse,
  SlotOccupancyApi,
  StorageLocationApi,
  StorageUnitApi,
} from "./api_client/types";

export { fetchCabinetAccessLogs } from "./api_client/audit";
export { fetchMe, fetchUsers, login } from "./api_client/auth";
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
