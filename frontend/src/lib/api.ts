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
  RegistrationOut,
  SlotOccupancyApi,
  StorageLocationApi,
  StorageUnitApi,
} from "./api_client/types";

export { fetchCabinetAccessLogs } from "./api_client/audit";
export { fetchMe, fetchUsers, login, register, registerWithCard, completeRegistration, linkCardForUser, unlinkCardForUser } from "./api_client/auth";
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
  enrollItem,
  adjustItemQuantity,
} from "./api_client/items";
export type { ItemEnrollOut } from "./api_client/items";
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
export type { ItemStatistic } from "./api_client/statistics";
export {
  fetchMostBorrowedItems,
  fetchMostDamagedItems,
} from "./api_client/statistics";
export type { BorrowingRecord } from "./api_client/borrowings";
export {
  fetchMyBorrowings,
  fetchUserBorrowings,
} from "./api_client/borrowings";
