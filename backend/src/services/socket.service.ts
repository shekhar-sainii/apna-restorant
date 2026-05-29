import { getIO } from "../sockets";

class SocketService {
  private getSafeIO() {
    try {
      return getIO();
    } catch {
      return null;
    }
  }

  emit(room: string, event: string, data: any): void {
    const io = this.getSafeIO();
    if (io) {
      io.to(room).emit(event, data);
    }
  }

  emitToAdmins(event: string, data: any): void {
    this.emit("admin-room", event, data);
  }

  emitToStaff(event: string, data: any): void {
    this.emit("staff-room", event, data);
    this.emit("admin-room", event, data);
  }

  emitToOrderRoom(orderId: string, event: string, data: any): void {
    this.emit(`order-${orderId}`, event, data);
  }

  emitToUser(userId: string, event: string, data: any): void {
    this.emit(`user-${userId}`, event, data);
  }
}

export default new SocketService();
