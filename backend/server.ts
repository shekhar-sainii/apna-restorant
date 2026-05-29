import http from "http";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import app from "./src/app";
import { initSocket } from "./src/sockets";
import { connectDB } from "./src/config/db";
import { validateEnv } from "./src/config/env";
import logger from "./src/utils/logger";

// Validate all env vars before starting
validateEnv();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Connect DB then start server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    logger.error("DB connection failed", err);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down...");
  server.close(() => process.exit(0));
});
export {};
