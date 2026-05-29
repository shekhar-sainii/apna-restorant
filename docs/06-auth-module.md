# 06 — Auth Module

> JWT Authentication, Refresh Tokens, RBAC, Guest Sessions

---

## 1. User Model — `src/models/User.model.js`

```js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["admin", "staff", "user"],
      default: "user",
    },
    isActive: { type: Boolean, default: true },
    profileImage: { type: String, default: null },
    refreshToken: { type: String, default: null }, // stored as hash
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Never send sensitive fields
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

module.exports = mongoose.model("User", userSchema);
```

---

## 2. Token Utils — `src/utils/generateToken.js`

```js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
};
```

---

## 3. Auth Repository — `src/modules/auth/auth.repository.js`

```js
const User = require("../../models/User.model");
const { hashToken } = require("../../utils/generateToken");

class AuthRepository {
  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findByPhone(phone) {
    return User.findOne({ phone });
  }

  async create(userData) {
    return User.create(userData);
  }

  async findById(id) {
    return User.findById(id).select("-password");
  }

  async saveRefreshToken(userId, refreshToken) {
    const hashed = hashToken(refreshToken);
    return User.findByIdAndUpdate(userId, { refreshToken: hashed });
  }

  async clearRefreshToken(userId) {
    return User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  async findByRefreshToken(userId, refreshToken) {
    const hashed = hashToken(refreshToken);
    return User.findOne({ _id: userId, refreshToken: hashed });
  }
}

module.exports = new AuthRepository();
```

---

## 4. Auth Service — `src/modules/auth/auth.service.js`

```js
const authRepository = require("./auth.repository");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../../utils/generateToken");
const ApiError = require("../../utils/ApiError");

class AuthService {
  async register({ name, email, phone, password }) {
    const emailExists = await authRepository.findByEmail(email);
    if (emailExists) throw ApiError.conflict("Email already registered");

    const phoneExists = await authRepository.findByPhone(phone);
    if (phoneExists) throw ApiError.conflict("Phone already registered");

    const user = await authRepository.create({ name, email, phone, password });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    await authRepository.saveRefreshToken(user._id, refreshToken);

    return { user: user.toSafeObject(), accessToken, refreshToken };
  }

  async login({ email, password }) {
    const user = await authRepository.findByEmail(email);
    if (!user) throw ApiError.unauthorized("Invalid credentials");

    if (!user.isActive) throw ApiError.unauthorized("Account is deactivated");

    const isValid = await user.comparePassword(password);
    if (!isValid) throw ApiError.unauthorized("Invalid credentials");

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    await authRepository.saveRefreshToken(user._id, refreshToken);

    return { user: user.toSafeObject(), accessToken, refreshToken };
  }

  async refresh(refreshToken) {
    if (!refreshToken) throw ApiError.unauthorized("No refresh token");

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const user = await authRepository.findByRefreshToken(decoded.userId, refreshToken);
    if (!user) throw ApiError.unauthorized("Refresh token not found or expired");

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);
    await authRepository.saveRefreshToken(user._id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId) {
    await authRepository.clearRefreshToken(userId);
  }
}

module.exports = new AuthService();
```

---

## 5. Auth Controller — `src/modules/auth/auth.controller.js`

```js
const authService = require("./auth.service");
const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const result = await authService.register({ name, email, phone, password });

  res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return ApiResponse.created(res, "Registration successful", {
    user: result.user,
    accessToken: result.accessToken,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });

  res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return ApiResponse.success(res, "Login successful", {
    user: result.user,
    accessToken: result.accessToken,
  });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const result = await authService.refresh(refreshToken);

  res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return ApiResponse.success(res, "Token refreshed", {
    accessToken: result.accessToken,
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  res.clearCookie("refreshToken");
  return ApiResponse.success(res, "Logged out successfully");
});

const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, "User data", req.user);
});

module.exports = { register, login, refresh, logout, getMe };
```

---

## 6. Auth Validator — `src/modules/auth/auth.validator.js`

```js
const { body } = require("express-validator");

const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("phone")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Valid 10-digit Indian phone required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginValidator = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = { registerValidator, loginValidator };
```

---

## 7. Validate Middleware — `src/middleware/validate.middleware.js`

```js
const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    throw ApiError.badRequest("Validation failed", formatted);
  }
  next();
};

module.exports = { validate };
```

---

## 8. Auth Routes — `src/modules/auth/auth.routes.js`

```js
const router = require("express").Router();
const { register, login, refresh, logout, getMe } = require("./auth.controller");
const { registerValidator, loginValidator } = require("./auth.validator");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { authLimiter } = require("../../middleware/rateLimiter.middleware");

router.post("/register", authLimiter, registerValidator, validate, register);
router.post("/login", authLimiter, loginValidator, validate, login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);

module.exports = router;
```

---

## 9. Guest Session — `src/models/GuestSession.model.js`

```js
const mongoose = require("mongoose");

const guestSessionSchema = new mongoose.Schema({
  guestSessionId: { type: String, required: true, unique: true },
  tableNumber: { type: Number, default: null },
  ipAddress: { type: String },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  createdAt: { type: Date, default: Date.now },
});

// TTL index — MongoDB auto-deletes after expiresAt
guestSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
guestSessionSchema.index({ guestSessionId: 1 }, { unique: true });

module.exports = mongoose.model("GuestSession", guestSessionSchema);
```

---

## 10. Guest Session API — POST /auth/guest-session

Add to auth controller:

```js
const { v4: uuidv4 } = require("uuid");
const GuestSession = require("../../models/GuestSession.model");

const createGuestSession = asyncHandler(async (req, res) => {
  const { tableNumber } = req.body;
  const guestSessionId = uuidv4();

  await GuestSession.create({
    guestSessionId,
    tableNumber: tableNumber || null,
    ipAddress: req.ip,
  });

  return ApiResponse.created(res, "Guest session created", { guestSessionId });
});
```

Add route:
```js
router.post("/guest-session", createGuestSession);
```

Frontend calls this once when guest visits `/table/:id` or loads the menu without login.

---

## Frontend: Auth Slice — `src/features/auth/authSlice.ts`

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IAuthUser } from "@shared/types";

interface AuthState {
  user: IAuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: IAuthUser; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
    updateAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, updateAccessToken } = authSlice.actions;
export default authSlice.reducer;
```

---

## Frontend: Token Refresh Interceptor — `src/services/api.ts`

```ts
import { BaseQueryFn, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { updateAccessToken, clearCredentials } from "../features/auth/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth.accessToken;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // Try refresh
    const refreshResult = await baseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const { accessToken } = (refreshResult.data as any).data;
      api.dispatch(updateAccessToken(accessToken));
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
    }
  }

  return result;
};
```

---

## Next → `07-menu-module.md`
