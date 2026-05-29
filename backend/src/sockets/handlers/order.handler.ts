import { Socket, Server } from "socket.io";
import logger from "../../utils/logger";
import Order from "../../models/Order.model";

export const orderHandler = (socket: Socket, io: Server) => {
  socket.on("join-order-room", async ({ orderId, guestSessionId }: { orderId: string; guestSessionId?: string }) => {
    if (!orderId) return;

    try {
      const order = await Order.findById(orderId);
      if (!order) return;

      const isOwner = socket.userId && order.customer?.toString() === socket.userId;
      const isGuest = guestSessionId && order.guestSessionId === guestSessionId;
      const isStaff = ["admin", "staff"].includes(socket.userRole || "");

      if (isOwner || isGuest || isStaff) {
        socket.join(`order-${orderId}`);
        logger.info(`Socket ${socket.id} joined order-${orderId}`);

        socket.emit("order-status-updated", {
          orderId,
          status: order.status,
          updatedAt: (order as any).updatedAt,
        });
      }
    } catch (err: any) {
      logger.error(`join-order-room error: ${err.message || err}`);
    }
  });

  socket.on("leave-order-room", ({ orderId }: { orderId: string }) => {
    if (!orderId) return;
    socket.leave(`order-${orderId}`);
    logger.info(`Socket ${socket.id} left order-${orderId}`);
  });
};
