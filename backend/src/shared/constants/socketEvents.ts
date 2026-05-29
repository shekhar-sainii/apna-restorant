export const SOCKET_EVENTS = {
  // Server → Client
  NEW_ORDER: "new-order",
  ORDER_STATUS_UPDATED: "order-status-updated",
  PAYMENT_SUCCESS: "payment-success",
  PAYMENT_FAILED: "payment-failed",
  ORDER_ASSIGNED: "order-assigned",
  NOTIFICATION: "notification",

  // Client → Server
  JOIN_ORDER_ROOM: "join-order-room",
  LEAVE_ORDER_ROOM: "leave-order-room",
  JOIN_ADMIN_ROOM: "join-admin-room",
  JOIN_STAFF_ROOM: "join-staff-room",
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
