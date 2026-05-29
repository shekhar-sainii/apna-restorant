export type NotificationType =
  | "new_order"
  | "order_accepted"
  | "order_preparing"
  | "order_ready"
  | "order_out_for_delivery"
  | "order_delivered"
  | "order_cancelled"
  | "payment_success"
  | "payment_failed";

export interface INotification {
  _id: string;
  recipient: string;
  recipientRole?: string;
  type: NotificationType;
  title: string;
  message: string;
  order?: string;
  isRead: boolean;
  createdAt: string;
}
