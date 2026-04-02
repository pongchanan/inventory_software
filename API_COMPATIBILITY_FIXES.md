# Frontend-Backend API Compatibility Fixes

**Date:** April 2, 2026  
**Status:** ✅ Complete

## Summary

Updated frontend API client to work with current backend implementation. The frontend was calling endpoints that don't exist yet in the backend, causing 404 errors.

## Changes Made

### ✅ Fixed Endpoints

#### 1. **Item Types Endpoint** → `/api/items/`
- **Before:** Frontend called `/api/item-types` (doesn't exist)
- **After:** Frontend now calls `/api/items/` with proper pagination handling
- **File:** `frontend/src/lib/api_client/core.ts`
- **Change:** 
  - Updated `fetchItemTypes()` to call `/api/items/` instead of `/api/item-types`
  - Converts backend `ItemOut` schema to frontend `ItemTypeApi` schema
  - Extracts items from paginated response
  - Maps `is_active` → `active`, `image_path` → `images`

#### 2. **Item Type by ID** 
- **Before:** Frontend called `GET /api/item-types/{id}` (doesn't exist)
- **After:** Fetches all items and filters in memory
- **File:** `frontend/src/lib/api_client/core.ts`
- **Change:** `fetchItemTypeById()` now uses `fetchItemTypes()` and finds by ID

#### 3. **Inventory Events**
- **Status:** Stubbed (endpoint not yet in backend)  
- **File:** `frontend/src/lib/api_client/core.ts`
- **Change:** `fetchInventoryEvents()` returns empty array with console warning

#### 4. **Storage Units & Locations**
- **Status:** Stubbed (endpoints not yet in backend)
- **Files:** `frontend/src/lib/api_client/core.ts`
- **Functions:** 
  - `fetchStorageUnits()` → returns `[]`
  - `fetchLocationsByUnit()` → returns `[]`

#### 5. **Occupancy Endpoints**
- **Status:** Stubbed (endpoints not yet in backend)
- **Files:** `frontend/src/lib/api_client/core.ts`
- **Functions:**
  - `fetchOccupancyByLocation()` → throws error
  - `fetchOccupancyByUnit()` → returns `[]`

### ⚠️ Not Yet Implemented (Item Modification)

These endpoints don't exist in backend yet. Calling them will raise informative errors:

| Endpoint | Function | Status |
|---|---|---|
| `POST /api/item-types` | `createItem()`, `createItemAuth()` | Not implemented |
| `PATCH /api/item-types/{id}` | `updateItem()` | Not implemented |
| `DELETE /api/item-types/{id}` | `deleteItem()`, `deleteItemAuth()` | Not implemented |
| `POST /api/item-types/{id}/images` | `uploadItemImage()`, `uploadItemImageAuth()` | Not implemented |

**Note:** These functions throw clear error messages directing implementers to create the backend endpoints.

### ✅ Already Working

These endpoints exist and work as-is:
- ✅ `POST /api/auth/login`
- ✅ `GET /api/auth/me` 
- ✅ `POST /api/auth/register`
- ✅ `GET /api/users` (requires admin auth)
- ✅ `POST /api/users/me/link-card`
- ✅ `POST /api/users/me/unlink-card`
- ✅ `GET /api/borrowings/me`
- ✅ `GET /api/borrowings/users/{user_id}`

## Build Status

✅ **Frontend builds successfully** with no TypeScript errors

```
✓ Compiled successfully in 14.7s
✓ Generated static pages in 844.1ms
```

## Testing

The 404 errors should be resolved:
- ✅ `GET /api/items` - Will return item list (formerly `/api/item-types`)
- ✅ `GET /api/users` - Will work with proper auth
- ⚠️ `GET /api/inventory/events` - Returns empty array (not implemented)
- ⚠️ `GET /api/item-types` - No longer called by frontend

## Next Steps

To fully implement the API contract, these endpoints need to be created in the backend:
1. Item modification endpoints (`POST`, `PATCH`, `DELETE` for items)
2. Inventory events endpoint
3. Storage units and locations endpoints
4. Occupancy endpoints

See [API_CONTRACT.md](docs/backend/API_CONTRACT.md) for full endpoint specifications.
