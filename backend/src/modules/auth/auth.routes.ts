import { Router } from "express";
import { register, login, refresh, logout, getMe, createGuestSession, googleLogin, forgotPassword, resetPassword } from "./auth.controller";
import { registerValidator, loginValidator } from "./auth.validator";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { authLimiter } from "../../middleware/rateLimiter.middleware";

const router = Router();

router.post("/register", authLimiter, registerValidator, validate, register);
router.post("/login", authLimiter, loginValidator, validate, login);
router.post("/google", authLimiter, googleLogin);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.post("/guest-session", createGuestSession);

export default router;
