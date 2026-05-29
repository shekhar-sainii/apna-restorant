import { Router } from "express";
import * as ctrl from "./coupon.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

router.get("/active", ctrl.getActiveOffers);
router.post("/apply", ctrl.applyCoupon);

router.get("/", authenticate, requireRole("admin"), ctrl.getCoupons);
router.post("/", authenticate, requireRole("admin"), ctrl.createCoupon);
router.patch("/:id", authenticate, requireRole("admin"), ctrl.updateCoupon);
router.delete("/:id", authenticate, requireRole("admin"), ctrl.deleteCoupon);

export default router;
