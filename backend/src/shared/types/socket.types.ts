import { IOrder } from "./order.types";
import { INotification } from "./notification.types";
import { OrderStatus } from "../constants/orderStatus";

export interface NewOrderPayload {
  order: IOrder;
}

export interface OrderStatusUpdatedPayload {
  orderId: string;
  status: OrderStatus;
  updatedAt: string;
  note?: string;
}

export interface PaymentSuccessPayload {
  orderId: string;
  paymentId: string;
}

export interface PaymentFailedPayload {
  orderId: string;
  reason: string;
}

export interface NotificationPayload {
  notification: INotification;
}
