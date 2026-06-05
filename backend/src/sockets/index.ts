import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";
import { orderHandler } from "./handlers/order.handler";
import { adminHandler } from "./handlers/admin.handler";

let io: SocketIOServer | undefined;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(",")
        : "*",
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as any;
        socket.userId = decoded.userId || decoded.id;
        socket.userRole = decoded.role || "user";
      } catch (err) {
        logger.debug("Socket token validation failed, treating as guest");
        socket.userId = null;
        socket.userRole = "guest";
      }
    } else {
      socket.userId = null;
      socket.userRole = "guest";
    }

    next();
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id} | Role: ${socket.userRole}`);

    if (socket.userRole === "admin") {
      socket.join("admin-room");
      logger.info(`Socket ${socket.id} joined admin-room`);
    } else if (socket.userRole === "staff") {
      socket.join("staff-room");
      logger.info(`Socket ${socket.id} joined staff-room`);
    }

    if (socket.userId) {
      socket.join(`user-${socket.userId}`);
      logger.info(`Socket ${socket.id} joined user-${socket.userId}`);
    }

    orderHandler(socket, io!);
    adminHandler(socket, io!);

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

export const getIO = (): SocketIOServer => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};
