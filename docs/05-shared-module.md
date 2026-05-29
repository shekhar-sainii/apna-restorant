# 05 — Shared Module

> Types, constants, and utilities shared between frontend and backend.
> This folder prevents duplication and keeps contracts in sync.

---

## Why Shared Module?

- One source of truth for `OrderStatus`, `Role`, `SocketEvent` names
- TypeScript types used in both backend (JS with JSDoc) and frontend (TS)
- Pricing logic identical on both sides (cart preview + backend calc)

---

## shared/constants/roles.ts

```ts
export const ROLES = {
  ADMIN: "admin",
  STAFF: "staff",
  USER: "user",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
```

---

## shared/constants/orderStatus.ts

```ts
export const ORDER_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  PREPARING: "preparing",
  READY: "ready",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order Placed",
  accepted: "Order Accepted",
  preparing: "Being Prepared",
  ready: "Ready to Serve",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered ✓",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "yellow",
  accepted: "blue",
  preparing: "orange",
  ready: "purple",
  out_for_delivery: "indigo",
  delivered: "green",
  cancelled: "red",
};

// Valid transitions: what status can come after current
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "delivered", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const isValidTransition = (current: OrderStatus, next: OrderStatus): boolean => {
  return STATUS_TRANSITIONS[current]?.includes(next) ?? false;
};
```

---

## shared/constants/socketEvents.ts

```ts
export const SOCKET_EVENTS = {
  // ─── Server → Client ────────────────
  NEW_ORDER: "new-order",
  ORDER_STATUS_UPDATED: "order-status-updated",
  PAYMENT_SUCCESS: "payment-success",
  PAYMENT_FAILED: "payment-failed",
  ORDER_ASSIGNED: "order-assigned",
  NOTIFICATION: "notification",

  // ─── Client → Server ────────────────
  JOIN_ORDER_ROOM: "join-order-room",
  LEAVE_ORDER_ROOM: "leave-order-room",
  JOIN_ADMIN_ROOM: "join-admin-room",
  JOIN_STAFF_ROOM: "join-staff-room",
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
```

---

## shared/types/user.types.ts

```ts
import { Role } from "../constants/roles";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
```

---

## shared/types/menu.types.ts

```ts
export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface IMenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: ICategory | string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime?: number;
  rating: {
    average: number;
    count: number;
  };
  tags?: string[];
  sortOrder: number;
}
```

---

## shared/types/order.types.ts

```ts
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
```

---

## shared/types/socket.types.ts

```ts
import { IOrder } from "./order.types";
import { INotification } from "./notification.types";
import { OrderStatus } from "../constants/orderStatus";

// Payloads for socket events

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
```

---

## shared/types/notification.types.ts

```ts
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
  type: NotificationType;
  title: string;
  message: string;
  order?: string;
  isRead: boolean;
  createdAt: string;
}
```

---

## shared/utils/pricing.ts

```ts
export interface PricingInput {
  items: Array<{ price: number; quantity: number }>;
  orderType: "dine-in" | "delivery" | "takeaway";
  gstPercent?: number;
  deliveryCharge?: number;
  freeDeliveryAbove?: number;
  couponDiscount?: number;
}

export interface PricingResult {
  subtotal: number;
  gstAmount: number;
  deliveryCharge: number;
  discountAmount: number;
  totalAmount: number;
}

export const calculatePricing = ({
  items,
  orderType,
  gstPercent = 5,
  deliveryCharge = 0,
  freeDeliveryAbove = 0,
  couponDiscount = 0,
}: PricingInput): PricingResult => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const gstAmount = Math.round((subtotal * gstPercent) / 100 * 100) / 100;

  let actualDeliveryCharge = 0;
  if (orderType === "delivery") {
    actualDeliveryCharge =
      freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove
        ? 0
        : deliveryCharge;
  }

  const discountAmount = Math.min(couponDiscount, subtotal);

  const totalAmount =
    Math.round(
      (subtotal + gstAmount + actualDeliveryCharge - discountAmount) * 100
    ) / 100;

  return {
    subtotal,
    gstAmount,
    deliveryCharge: actualDeliveryCharge,
    discountAmount,
    totalAmount,
  };
};
```

---

## shared/types/index.ts — Barrel Export

```ts
// All types
export * from "./user.types";
export * from "./menu.types";
export * from "./order.types";
export * from "./payment.types";
export * from "./notification.types";
export * from "./socket.types";

// All constants
export * from "../constants/roles";
export * from "../constants/orderStatus";
export * from "../constants/socketEvents";

// All utils
export * from "../utils/pricing";
```

---

## How Frontend Uses Shared Types

In `frontend/src/types/index.ts`:

```ts
// Re-export everything from shared
export * from "../../shared/types";
```

In `frontend/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Then use anywhere:

```ts
import { IOrder, ORDER_STATUS, SOCKET_EVENTS } from "@shared/types";
```

---

## How Backend Uses Shared Types (via JSDoc)

Backend is plain JavaScript, but can import shared constants:

```js
// backend/src/modules/order/order.service.js
const { ORDER_STATUS, isValidTransition } = require("../../../shared/constants/orderStatus");
```

Add path alias in `nodemon.json`:

```json
{
  "watch": ["src/"],
  "ext": "js,json",
  "ignore": ["node_modules/"],
  "exec": "node server.js"
}
```

---

## Next → `06-auth-module.md`
