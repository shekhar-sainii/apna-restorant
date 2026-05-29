import fetchApi from "./api";

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  getAll: (): Promise<{ data: AppNotification[] }> => fetchApi("/notifications"),

  markRead: (id: string): Promise<{ data: AppNotification }> =>
    fetchApi(`/notifications/${id}/read`, { method: "PATCH" }),

  markAllRead: (): Promise<void> =>
    fetchApi("/notifications/read-all", { method: "PATCH" }),
};

export default notificationService;
