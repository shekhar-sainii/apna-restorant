# 04 — Backend Setup

> Express App Bootstrap, MongoDB Connection, Middleware Stack, Error Handling

---

## 1. server.js — Entry Point

```js
// backend/server.js
const http = require("http");
const app = require("./src/app");
const { initSocket } = require("./src/sockets");
const { connectDB } = require("./src/config/db");
const { validateEnv } = require("./src/config/env");
const logger = require("./src/utils/logger");

// Validate all env vars before starting
validateEnv();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Connect DB then start server
connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  });
}).catch((err) => {
  logger.error("DB connection failed", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down...");
  server.close(() => process.exit(0));
});
```

---

## 2. src/app.js — Express App

```js
// backend/src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { errorHandler } = require("./middleware/errorHandler.middleware");
const { notFound } = require("./middleware/notFound.middleware");
const { apiLimiter } = require("./middleware/rateLimiter.middleware");
const routes = require("./routes");
const logger = require("./utils/logger");

const app = express();

// ─── Security ────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));

// ─── Body Parsing ─────────────────────────────────────────
// NOTE: Razorpay webhook needs raw body — must come BEFORE express.json()
app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Logging ──────────────────────────────────────────────
app.use(morgan("combined", {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// ─── Rate Limiting ────────────────────────────────────────
app.use("/api/", apiLimiter);

// ─── Health Check ─────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────
app.use("/api/v1", routes);

// ─── Error Handling ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
```

---

## 3. src/config/db.js — MongoDB Connection

```js
// backend/src/config/db.js
const mongoose = require("mongoose");
const logger = require("../utils/logger");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }
};

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected. Attempting to reconnect...");
  isConnected = false;
});

module.exports = { connectDB };
```

---

## 4. src/config/env.js — Environment Validation

```js
// backend/src/config/env.js
const required = [
  "PORT",
  "NODE_ENV",
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "FRONTEND_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
];

const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
};

module.exports = { validateEnv };
```

---

## 5. src/utils/ApiError.js

```js
// backend/src/utils/ApiError.js
class ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.code = ApiError.getCode(statusCode);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static getCode(statusCode) {
    const codes = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "UNPROCESSABLE",
      429: "RATE_LIMITED",
      500: "INTERNAL_ERROR",
    };
    return codes[statusCode] || "ERROR";
  }

  static badRequest(message, errors) {
    return new ApiError(400, message, errors);
  }
  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }
  static forbidden(message = "Access denied") {
    return new ApiError(403, message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }
  static conflict(message) {
    return new ApiError(409, message);
  }
  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
```

---

## 6. src/utils/ApiResponse.js

```js
// backend/src/utils/ApiResponse.js
class ApiResponse {
  constructor(statusCode, message, data = null, meta = null) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    if (data !== null) this.data = data;
    if (meta !== null) this.meta = meta;
  }

  static success(res, message, data, statusCode = 200, meta = null) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data, meta));
  }

  static created(res, message, data) {
    return ApiResponse.success(res, message, data, 201);
  }

  static paginated(res, message, data, page, limit, total) {
    const meta = {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    };
    return ApiResponse.success(res, message, data, 200, meta);
  }
}

module.exports = ApiResponse;
```

---

## 7. src/utils/asyncHandler.js

```js
// backend/src/utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
```

---

## 8. src/utils/logger.js — Winston Logger

```js
// backend/src/utils/logger.js
const winston = require("winston");

const levels = {
  error: 0, warn: 1, info: 2, http: 3, debug: 4,
};

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      format
    ),
  }),
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    format,
  }),
  new winston.transports.File({
    filename: "logs/combined.log",
    format,
  }),
];

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "http" : "debug",
  levels,
  transports,
});

module.exports = logger;
```

---

## 9. Middleware Files

### src/middleware/errorHandler.middleware.js

```js
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      code: err.code,
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
      code: "VALIDATION_ERROR",
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code: "CONFLICT",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      code: "UNAUTHORIZED",
    });
  }

  // Default 500
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
    code: "INTERNAL_ERROR",
  });
};

module.exports = { errorHandler };
```

### src/middleware/rateLimiter.middleware.js

```js
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    code: "RATE_LIMITED",
  },
});

// Stricter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many auth attempts. Please wait 15 minutes.",
    code: "RATE_LIMITED",
  },
});

module.exports = { apiLimiter, authLimiter };
```

### src/middleware/auth.middleware.js

```js
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User.model");

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId).select("-password -refreshToken");

    if (!user || !user.isActive) {
      throw ApiError.unauthorized("User not found or inactive");
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.unauthorized("Invalid or expired token");
  }
});

// Optional auth — attaches user if token present, continues either way
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = await User.findById(decoded.userId).select("-password -refreshToken");
  } catch (_) {
    // ignore invalid token in optional auth
  }
  next();
});

module.exports = { authenticate, optionalAuth };
```

### src/middleware/role.middleware.js

```js
const ApiError = require("../utils/ApiError");

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  if (!roles.includes(req.user.role)) {
    throw ApiError.forbidden(`Requires role: ${roles.join(" or ")}`);
  }
  next();
};

module.exports = { requireRole };
```

---

## 10. src/routes/index.js — Route Mounting

```js
// backend/src/routes/index.js
const router = require("express").Router();

const authRoutes = require("../modules/auth/auth.routes");
const menuRoutes = require("../modules/menu/menu.routes");
const orderRoutes = require("../modules/order/order.routes");
const paymentRoutes = require("../modules/payment/payment.routes");
const userRoutes = require("../modules/user/user.routes");
const notificationRoutes = require("../modules/notification/notification.routes");
const analyticsRoutes = require("../modules/analytics/analytics.routes");
const couponRoutes = require("../modules/coupon/coupon.routes");

router.use("/auth", authRoutes);
router.use("/menu", menuRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/users", userRoutes);
router.use("/notifications", notificationRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/coupons", couponRoutes);

module.exports = router;
```

---

## 11. package.json

```json
{
  "name": "restaurant-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "lint": "eslint src/"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## Next → `05-shared-module.md`
