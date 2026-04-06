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
 * Uses /api/borrowings/popular endpoint
 */
export async function fetchMostBorrowedItems(limit: number = 5): Promise<ItemStatistic[]> {
  try {
    const response = await fetch(
      `${API_BASE}/api/borrowings/popular?page_size=${limit}&page=1`,
      {
        headers: authHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch most borrowed items: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform response to ItemStatistic format
    // data.items contains: {item_id, name, image_path, borrow_count}
    const colors = ["#ee4d2d", "#ff7f50", "#ffa726", "#ffb74d", "#ffc107"];
    return data.items.map((item: any, index: number) => ({
      name: item.name,
      value: item.borrow_count,
      image_url: item.image_path,
      color: colors[index % colors.length],
    }));
  } catch (error) {
    console.error('Failed to fetch most borrowed items:', error);
    return [];
  }
}

/**
 * Get statistics on which items have the most damage reports
 * Fetches all damage reports and aggregates by item
 */
export async function fetchMostDamagedItems(limit: number = 5): Promise<ItemStatistic[]> {
  try {
    const response = await fetch(
      `${API_BASE}/api/damaged-reports/`,
      {
        headers: authHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch damaged reports: ${response.statusText}`);
    }

    const reports = await response.json();
    
    // Aggregate damage reports by item
    const damageCount: { [key: string]: { name: string; count: number } } = {};
    
    reports.forEach((report: any) => {
      const itemKey = `item_${report.item_id}`;
      if (!damageCount[itemKey]) {
        damageCount[itemKey] = { 
          name: report.topic || `Item ${report.item_id}`, 
          count: 0 
        };
      }
      damageCount[itemKey].count += 1;
    });

    // Convert to array and sort by count
    const sorted = Object.values(damageCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    // Apply colors
    const colors = ["#ee4d2d", "#ff7f50", "#ffa726", "#ffb74d", "#ffc107"];
    return sorted.map((item, index) => ({
      name: item.name,
      value: item.count,
      color: colors[index % colors.length],
    }));
  } catch (error) {
    console.error('Failed to fetch most damaged items:', error);
    return [];
  }
}
