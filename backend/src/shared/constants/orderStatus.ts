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
