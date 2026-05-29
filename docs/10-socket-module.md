# 10 — Socket Module

> Socket.IO Server Setup, Room Management, Event Handlers, Frontend Hooks

---

## 1. Socket.IO Server — `src/sockets/index.js`

```js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { orderHandler } = require("./handlers/order.handler");
const { adminHandler } = require("./handlers/admin.handler");

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Auth Middleware ──────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
      } catch {
        // Invalid token → treat as guest (still allow connection)
        socket.userId = null;
        socket.userRole = "guest";
      }
    } else {
      socket.userId = null;
      socket.userRole = "guest";
    }

    next();
  });

  // ─── Connection Handler ───────────────────────────────────
  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id} | Role: ${socket.userRole}`);

    // Auto-join role rooms for authenticated users
    if (socket.userRole === "admin") {
      socket.join("admin-room");
      logger.info(`Admin ${socket.userId} joined admin-room`);
    }

    if (socket.userRole === "staff") {
      socket.join("staff-room");
      logger.info(`Staff ${socket.userId} joined staff-room`);
    }

    // Auto-join personal notification room
    if (socket.userId) {
      socket.join(`user-${socket.userId}`);
    }

    // Register event handlers
    orderHandler(socket, io);
    adminHandler(socket, io);

    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });

    socket.on("error", (err) => {
      logger.error(`Socket error: ${socket.id}`, err);
    });
  });

  logger.info("Socket.IO initialized");
  return io;
};

// Getter to use io anywhere
const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};

module.exports = { initSocket, getIO };
```

---

## 2. Order Handler — `src/sockets/handlers/order.handler.js`

```js
const logger = require("../../utils/logger");
const Order = require("../../models/Order.model");

const orderHandler = (socket, io) => {
  // Customer joins their order tracking room
  socket.on("join-order-room", async ({ orderId, guestSessionId }) => {
    if (!orderId) return;

    try {
      // Verify the user has access to this order
      const order = await Order.findById(orderId);
      if (!order) return;

      const isOwner = socket.userId && order.customer?.toString() === socket.userId;
      const isGuest = guestSessionId && order.guestSessionId === guestSessionId;
      const isStaff = ["admin", "staff"].includes(socket.userRole);

      if (isOwner || isGuest || isStaff) {
        socket.join(`order-${orderId}`);
        logger.info(`Socket ${socket.id} joined order-${orderId}`);

        // Send current status immediately
        socket.emit("order-status-updated", {
          orderId,
          status: order.status,
          updatedAt: order.updatedAt,
        });
      }
    } catch (err) {
      logger.error("join-order-room error:", err);
    }
  });

  socket.on("leave-order-room", ({ orderId }) => {
    if (!orderId) return;
    socket.leave(`order-${orderId}`);
    logger.info(`Socket ${socket.id} left order-${orderId}`);
  });
};

module.exports = { orderHandler };
```

---

## 3. Admin Handler — `src/sockets/handlers/admin.handler.js`

```js
const orderHandler = (socket, io) => {
  // Manual join (in case auto-join failed)
  socket.on("join-admin-room", () => {
    if (socket.userRole !== "admin") return;
    socket.join("admin-room");
  });

  socket.on("join-staff-room", () => {
    if (!["admin", "staff"].includes(socket.userRole)) return;
    socket.join("staff-room");
  });
};

module.exports = { adminHandler: orderHandler };
```

---

## 4. Socket Service — `src/services/socket.service.js`

> This service is used by controllers and other services to emit events.

```js
const { getIO } = require("../sockets");
const logger = require("../utils/logger");

class SocketService {
  emit(room, event, data) {
    try {
      const io = getIO();
      io.to(room).emit(event, data);
      logger.info(`Socket emit → room: ${room} | event: ${event}`);
    } catch (err) {
      logger.error("Socket emit error:", err);
    }
  }

  emitToAdmins(event, data) {
    this.emit("admin-room", event, data);
  }

  emitToStaff(event, data) {
    this.emit("staff-room", event, data);
    this.emit("admin-room", event, data); // Admin sees staff events too
  }

  emitToOrderRoom(orderId, event, data) {
    this.emit(`order-${orderId}`, event, data);
  }

  emitToUser(userId, event, data) {
    this.emit(`user-${userId}`, event, data);
  }
}

module.exports = new SocketService();
```

---

## 5. Frontend: Socket Client — `src/services/socket.ts`

```ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    throw new Error("Socket not initialized. Call initSocket() first.");
  }
  return socket;
};

export const initSocket = (accessToken?: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_API_URL.replace("/api/v1", ""), {
    auth: { token: accessToken || null },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

---

## 6. Frontend: useSocket Hook — `src/hooks/useSocket.ts`

```ts
import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { initSocket, disconnectSocket } from "../services/socket";
import { SOCKET_EVENTS } from "@shared/constants/socketEvents";
import { setConnected } from "../features/socket/socketSlice";
import { addNotification } from "../features/notification/notificationSlice";
import type { RootState } from "../app/store";

export const useSocket = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const socketRef = useRef<ReturnType<typeof initSocket> | null>(null);

  useEffect(() => {
    const socket = initSocket(accessToken || undefined);
    socketRef.current = socket;

    socket.on("connect", () => {
      dispatch(setConnected(true));
    });

    socket.on("disconnect", () => {
      dispatch(setConnected(false));
    });

    socket.on(SOCKET_EVENTS.NOTIFICATION, (payload) => {
      dispatch(addNotification(payload.notification));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off(SOCKET_EVENTS.NOTIFICATION);
    };
  }, [accessToken]);

  return socketRef.current;
};
```

---

## 7. Frontend: useOrderTracking Hook — `src/hooks/useOrderTracking.ts`

```ts
import { useEffect, useState } from "react";
import { getSocket } from "../services/socket";
import { SOCKET_EVENTS } from "@shared/constants/socketEvents";
import { OrderStatus } from "@shared/types";

interface TrackingState {
  status: OrderStatus | null;
  updatedAt: string | null;
  paymentStatus: "idle" | "success" | "failed";
}

export const useOrderTracking = (orderId: string, guestSessionId?: string) => {
  const [tracking, setTracking] = useState<TrackingState>({
    status: null,
    updatedAt: null,
    paymentStatus: "idle",
  });

  useEffect(() => {
    if (!orderId) return;

    const socket = getSocket();

    // Join the order room
    socket.emit(SOCKET_EVENTS.JOIN_ORDER_ROOM, { orderId, guestSessionId });

    socket.on(SOCKET_EVENTS.ORDER_STATUS_UPDATED, (payload) => {
      if (payload.orderId === orderId) {
        setTracking((prev) => ({
          ...prev,
          status: payload.status,
          updatedAt: payload.updatedAt,
        }));
      }
    });

    socket.on(SOCKET_EVENTS.PAYMENT_SUCCESS, (payload) => {
      if (payload.orderId === orderId) {
        setTracking((prev) => ({ ...prev, paymentStatus: "success" }));
      }
    });

    socket.on(SOCKET_EVENTS.PAYMENT_FAILED, (payload) => {
      if (payload.orderId === orderId) {
        setTracking((prev) => ({ ...prev, paymentStatus: "failed" }));
      }
    });

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_ORDER_ROOM, { orderId });
      socket.off(SOCKET_EVENTS.ORDER_STATUS_UPDATED);
      socket.off(SOCKET_EVENTS.PAYMENT_SUCCESS);
      socket.off(SOCKET_EVENTS.PAYMENT_FAILED);
    };
  }, [orderId]);

  return tracking;
};
```

---

## 8. Frontend: Admin Notifications Hook — `src/hooks/useAdminNotifications.ts`

```ts
import { useEffect } from "react";
import { getSocket } from "../services/socket";
import { SOCKET_EVENTS } from "@shared/constants/socketEvents";
import { useDispatch } from "react-redux";
import { addNotification } from "../features/notification/notificationSlice";
import toast from "react-hot-toast";

export const useAdminNotifications = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const socket = getSocket();

    socket.on(SOCKET_EVENTS.NEW_ORDER, (payload) => {
      toast.success(`New order: ${payload.order.orderNumber}`, {
        duration: 6000,
        icon: "🔔",
      });
      // Optionally play a sound
      new Audio("/notification.mp3").play().catch(() => {});
    });

    socket.on(SOCKET_EVENTS.PAYMENT_SUCCESS, (payload) => {
      toast.success(`Payment received for order`, { icon: "💳" });
    });

    return () => {
      socket.off(SOCKET_EVENTS.NEW_ORDER);
      socket.off(SOCKET_EVENTS.PAYMENT_SUCCESS);
    };
  }, []);
};
```

---

## 9. Notification Model + Service

### `src/models/Notification.model.js`

```js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recipientRole: String, // for broadcasting to all admins
  type: {
    type: String,
    enum: [
      "new_order", "order_accepted", "order_preparing", "order_ready",
      "order_out_for_delivery", "order_delivered", "order_cancelled",
      "payment_success", "payment_failed",
    ],
  },
  title: String,
  message: String,
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
```

### `src/modules/notification/notification.service.js`

```js
const Notification = require("../../models/Notification.model");
const User = require("../../models/User.model");
const socketService = require("../../services/socket.service");

class NotificationService {
  async createForUser({ userId, type, title, message, orderId }) {
    const notification = await Notification.create({
      recipient: userId,
      type,
      title,
      message,
      order: orderId,
    });

    socketService.emitToUser(userId.toString(), "notification", { notification });
    return notification;
  }

  async createForAdmins({ type, title, message, orderId }) {
    const admins = await User.find({ role: "admin", isActive: true }).select("_id");

    const notifications = await Notification.insertMany(
      admins.map((admin) => ({
        recipient: admin._id,
        recipientRole: "admin",
        type,
        title,
        message,
        order: orderId,
      }))
    );

    // Already emitted via admin-room socket in order service
    return notifications;
  }

  async getForUser(userId, { page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);
    return { notifications, total, unreadCount };
  }

  async markRead(id, userId) {
    return Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true },
      { new: true }
    );
  }

  async markAllRead(userId) {
    return Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
  }
}

module.exports = new NotificationService();
```

---

## Next → `11-frontend-setup.md`
