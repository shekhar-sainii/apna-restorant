import { Router } from "express";
import * as ctrl from "./payment.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

router.post("/webhook", ctrl.webhook);
router.post("/create-order", ctrl.createOrder);
router.post("/verify", ctrl.verifyPayment);
router.get("/order/:orderId", authenticate, requireRole("admin"), ctrl.getPaymentDetails);

export default router;
