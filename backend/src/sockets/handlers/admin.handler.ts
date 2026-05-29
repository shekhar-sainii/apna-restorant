import { Socket, Server } from "socket.io";

export const adminHandler = (socket: Socket, io: Server) => {
  socket.on("join-admin-room", () => {
    if (socket.userRole === "admin") {
      socket.join("admin-room");
    }
  });

  socket.on("join-staff-room", () => {
    if (["admin", "staff"].includes(socket.userRole || "")) {
      socket.join("staff-room");
    }
  });
};
