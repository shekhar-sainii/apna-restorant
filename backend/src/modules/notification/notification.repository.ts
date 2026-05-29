import Notification, { INotification } from "../../models/Notification.model";

class NotificationRepository {
  async create(data: Partial<INotification>): Promise<INotification> {
    return Notification.create(data);
  }

  async findByRecipient(userId: string, limit = 50): Promise<INotification[]> {
    return Notification.find({ recipient: userId as any })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async findByRole(role: "admin" | "staff" | "user", limit = 50): Promise<INotification[]> {
    return Notification.find({ recipientRole: role })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async markAsRead(id: string): Promise<INotification | null> {
    return Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
  }

  async markAllAsReadForUser(userId: string): Promise<void> {
    await Notification.updateMany({ recipient: userId as any, isRead: false }, { isRead: true });
  }

  async markAllAsReadForRole(role: "admin" | "staff" | "user"): Promise<void> {
    await Notification.updateMany({ recipientRole: role, isRead: false }, { isRead: true });
  }
}

export default new NotificationRepository();
