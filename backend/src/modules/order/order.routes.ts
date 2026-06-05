import { Router } from "express";
import * as ctrl from "./order.controller";
import { authenticate, optionalAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

router.post("/", optionalAuth, ctrl.createOrder);
router.get("/", authenticate, requireRole("admin"), ctrl.getAllOrders);
router.get("/my", authenticate, ctrl.getMyOrders);
router.get("/staff", authenticate, requireRole("staff", "admin"), ctrl.getStaffOrders);
router.get("/:id", optionalAuth, ctrl.getOrderById);
router.patch("/:id/status", authenticate, requireRole("staff", "admin"), ctrl.updateStatus);
router.patch("/:id/cancel", optionalAuth, ctrl.cancelOrder);
router.patch("/:id/assign", authenticate, requireRole("admin"), ctrl.assignStaff);
router.patch("/:id/payment", authenticate, requireRole("staff", "admin"), ctrl.updatePaymentStatus);

export default router;
