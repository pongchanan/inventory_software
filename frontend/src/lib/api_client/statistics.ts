import { fetchInventoryEvents, fetchItemTypes, API_BASE, authHeaders } from "./core";
import { Loan, LoanCreate, LoanDetail } from "./types";

export interface ItemStatistic {
  name: string;
  value: number;
  image_url?: string;
  color?: string;
}

/**
 * Get statistics on which items are borrowed the most
 */
export async function fetchMostBorrowedItems(limit: number = 5): Promise<ItemStatistic[]> {
  // MOCK DATA - Remove this when backend API is ready
  const mockData: ItemStatistic[] = [
    { name: "Laptop", value: 45, color: "#ee4d2d" },
    { name: "Monitor", value: 38, color: "#ff7f50" },
    { name: "Keyboard", value: 32, color: "#ffa726" },
    { name: "Mouse", value: 28, color: "#ffb74d" },
    { name: "USB Cable", value: 22, color: "#ffc107" },
  ];
  return mockData.slice(0, limit);

  try {
    const response = await fetch(
      `${API_BASE}/api/stats/most-borrowed?limit=${limit}`,
      {
        headers: authHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch most borrowed items: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch most borrowed items:', error);
    return [];
  }
}

/**
 * Get statistics on which items have the most damage reports
 */
export async function fetchMostDamagedItems(limit: number = 5): Promise<ItemStatistic[]> {
  // MOCK DATA - Remove this when backend API is ready
  const mockData: ItemStatistic[] = [
    { name: "Monitor", value: 12, color: "#ee4d2d" },
    { name: "Keyboard", value: 8, color: "#ff7f50" },
    { name: "USB Cable", value: 7, color: "#ffa726" },
    { name: "Mouse", value: 5, color: "#ffb74d" },
    { name: "Charger", value: 4, color: "#ffc107" },
  ];
  return mockData.slice(0, limit);

  try {
    const response = await fetch(
      `${API_BASE}/api/stats/most-damaged?limit=${limit}`,
      {
        headers: authHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch most damaged items: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch most damaged items:', error);
    return [];
  }
}
