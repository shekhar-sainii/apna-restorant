import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { notFound } from "./middleware/notFound.middleware";
import { apiLimiter } from "./middleware/rateLimiter.middleware";
import logger from "./utils/logger";
import routes from "./routes";

const app = express();

// ─── Security ────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : [];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow if no origin (mobile app, curl, postman) or if development mode
    if (!origin || process.env.NODE_ENV === "development") {
      return callback(null, true);
    }
    
    // Check if origin is in the allowed FRONTEND_URL list
    const isAllowed = allowedOrigins.some(o => o.trim() === origin);
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // handle preflight for all routes

// ─── Body Parsing ─────────────────────────────────────────
// NOTE: Razorpay webhook needs raw body — must come BEFORE express.json()
app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Logging ──────────────────────────────────────────────
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.http(message.trim()) },
  })
);

// ─── Rate Limiting ────────────────────────────────────────
app.use("/api/", apiLimiter);


// ─── Health Check ─────────────────────────────────────────
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbHealthy = dbState === 1; // 1 = connected

  res.status(isDbHealthy ? 200 : 503).json({
    status: isDbHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    database: {
      status: isDbHealthy ? "connected" : "disconnected",
      state: dbState,
    },
  });
});

// ─── API Routes ───────────────────────────────────────────
app.use("/api/v1", routes);

// ─── Error Handling ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
