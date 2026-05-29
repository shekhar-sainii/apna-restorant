import http from "http";
import { AddressInfo } from "net";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import app from "../app";
import { initSocket } from "../sockets";
import { generateAccessToken } from "../utils/generateToken";

describe("Socket.IO Backend Integration", () => {
  let httpServer: http.Server;
  let clientSocket: ClientSocket;
  let port: number;

  beforeAll((done) => {
    httpServer = http.createServer(app);
    initSocket(httpServer);
    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    httpServer.close(done);
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it("should authenticate and connect successfully with valid token", (done) => {
    const adminToken = generateAccessToken("adminUserId", "admin");
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: adminToken },
      transports: ["websocket"],
    });

    clientSocket.on("connect", () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });

  it("should connect as guest when token is invalid or missing", (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: "invalid-token-value" },
      transports: ["websocket"],
    });

    clientSocket.on("connect", () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });

  it("should allow client to join and leave order rooms", (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ["websocket"],
    });

    clientSocket.on("connect", () => {
      clientSocket.emit("join-order-room", { orderId: "507f1f77bcf86cd799439011" });
      
      setTimeout(() => {
        clientSocket.emit("leave-order-room", { orderId: "507f1f77bcf86cd799439011" });
        done();
      }, 100);
    });
  });
});
