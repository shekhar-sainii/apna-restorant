import { OrderStatus } from "../constants/orderStatus";

export type OrderType = "dine-in" | "delivery" | "takeaway";
export type PaymentMethod = "cash" | "online";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface IOrderItem {
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface IDeliveryAddress {
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  pincode: string;
  coordinates?: { lat: number; lng: number };
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  customer?: string;
  guestSessionId?: string;
  guestName?: string;
  guestPhone?: string;
  items: IOrderItem[];
  orderType: OrderType;
  tableNumber?: number;
  deliveryAddress?: IDeliveryAddress;
  subtotal: number;
  gstAmount: number;
  gstPercent: number;
  deliveryCharge: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    updatedAt: string;
    note?: string;
  }>;
  assignedStaff?: string;
  isGuestOrder: boolean;
  specialInstructions?: string;
  estimatedDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  isVeg: boolean;
}
