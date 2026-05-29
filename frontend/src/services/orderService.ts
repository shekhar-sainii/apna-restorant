import fetchApi from "./api";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type OrderType = "dine-in" | "takeaway" | "delivery";
export type PaymentMethod = "cash" | "online";

export interface OrderItem {
  menuItem?: { _id: string; name: string; price: number };
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  selectedSize?: string;
}

export interface DeliveryAddress {
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  pincode: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer?: { _id: string; name: string; email: string };
  guestName?: string;
  guestPhone?: string;
  items: OrderItem[];
  status: OrderStatus;
  orderType: OrderType;
  tableNumber?: number;
  deliveryAddress?: DeliveryAddress;
  subtotal: number;
  gstAmount: number;
  gstPercent: number;
  deliveryCharge: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  specialInstructions?: string;
  createdAt: string;
}

export interface OrdersResponse {
  data: Order[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateOrderPayload {
  items: { menuItemId: string; quantity: number }[];
  orderType: OrderType;
  tableNumber?: number;
  deliveryAddress?: DeliveryAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  specialInstructions?: string;
  guestSessionId?: string;
  guestName?: string;
  guestPhone?: string;
}

export const orderService = {
  create: (payload: CreateOrderPayload): Promise<{ data: Order }> =>
    fetchApi("/orders", { method: "POST", body: JSON.stringify(payload) }),

  getById: (id: string, guestSessionId?: string): Promise<{ data: Order }> => {
    const q = guestSessionId ? `?guestSessionId=${encodeURIComponent(guestSessionId)}` : "";
    return fetchApi(`/orders/${id}${q}`);
  },

  getMyOrders: (params?: { page?: number; limit?: number }): Promise<OrdersResponse> => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString() ? `?${qs}` : "";
    return fetchApi(`/orders/my${q}`);
  },

  // Admin
  getAll: (params?: { status?: string; page?: number; limit?: number }): Promise<OrdersResponse> => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString() ? `?${qs}` : "";
    return fetchApi(`/orders${q}`);
  },

  updateStatus: (id: string, status: string, note?: string) =>
    fetchApi(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    }),

  cancel: (id: string) => fetchApi(`/orders/${id}/cancel`, { method: "PATCH" }),
};

export default orderService;
