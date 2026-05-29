import { Router } from "express";
import * as ctrl from "./user.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

router.use(authenticate);

// Profile
router.get("/profile", ctrl.getProfile);
router.patch("/profile", ctrl.updateProfile);

// Addresses
router.get("/addresses", ctrl.getAddresses);
router.post("/addresses", ctrl.addAddress);
router.patch("/addresses/:id", ctrl.updateAddress);
router.delete("/addresses/:id", ctrl.deleteAddress);

// Admin-only endpoints
router.get("/", requireRole("admin"), ctrl.getAllUsers);
router.patch("/:id/status", requireRole("admin"), ctrl.toggleUserStatus);
router.patch("/:id/role", requireRole("admin"), ctrl.updateUserRole);

export default router;
