import notificationRepository from "./notification.repository";
import ApiError from "../../utils/ApiError";

class NotificationService {
  async createForAdmins(data: { type: string; title: string; message: string; orderId: any }): Promise<void> {
    await notificationRepository.create({
      recipientRole: "admin",
      type: data.type as any,
      title: data.title,
      message: data.message,
      order: data.orderId,
    });
  }

  async createForUser(data: { userId: any; type: string; title: string; message: string; orderId: any }): Promise<void> {
    await notificationRepository.create({
      recipient: data.userId,
      type: data.type as any,
      title: data.title,
      message: data.message,
      order: data.orderId,
    });
  }

  async getMyNotifications(user: any) {
    if (user.role === "admin") {
      return notificationRepository.findByRole("admin");
    } else if (user.role === "staff") {
      return notificationRepository.findByRole("staff");
    }
    return notificationRepository.findByRecipient(user._id.toString());
  }

  async markRead(id: string, user: any) {
    const notif = await notificationRepository.markAsRead(id);
    if (!notif) throw ApiError.notFound("Notification not found");
    return notif;
  }

  async markAllRead(user: any) {
    if (user.role === "admin") {
      await notificationRepository.markAllAsReadForRole("admin");
    } else if (user.role === "staff") {
      await notificationRepository.markAllAsReadForRole("staff");
    } else {
      await notificationRepository.markAllAsReadForUser(user._id.toString());
    }
  }
}

export default new NotificationService();
