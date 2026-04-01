import { apiCall, authHeaders } from "./core";

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface NotificationStats {
  unread_count: number;
  total_count: number;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unread_count: number;
  total_count: number;
}

/**
 * Get all notifications for the current user
 */
export async function getNotifications(
  limit: number = 50
): Promise<NotificationListResponse> {
  const url = new URL("/api/notifications", window.location.origin);
  url.searchParams.set("limit", limit.toString());

  const response = await fetch(url.toString(), {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get unread notifications for the current user
 */
export async function getUnreadNotifications(
  limit: number = 10
): Promise<Notification[]> {
  const url = new URL("/api/notifications/unread", window.location.origin);
  url.searchParams.set("limit", limit.toString());

  const response = await fetch(url.toString(), {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch unread notifications: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(): Promise<NotificationStats> {
  const response = await fetch(
    new URL("/api/notifications/stats", window.location.origin).toString(),
    {
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch notification stats: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: number
): Promise<Notification> {
  const response = await fetch(
    new URL(`/api/notifications/${notificationId}/read`, window.location.origin).toString(),
    {
      method: "PUT",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to mark notification as read: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ message: string }> {
  const response = await fetch(
    new URL("/api/notifications/read-all", window.location.origin).toString(),
    {
      method: "PUT",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to mark all notifications as read: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: number
): Promise<void> {
  const response = await fetch(
    new URL(`/api/notifications/${notificationId}`, window.location.origin).toString(),
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete notification: ${response.statusText}`);
  }
}

/**
 * Delete all notifications
 */
export async function deleteAllNotifications(): Promise<void> {
  const response = await fetch(
    new URL("/api/notifications", window.location.origin).toString(),
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to delete all notifications: ${response.statusText}`
    );
  }
}
