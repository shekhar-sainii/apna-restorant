import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import menuRoutes from "../modules/menu/menu.routes";
import orderRoutes from "../modules/order/order.routes";
import paymentRoutes from "../modules/payment/payment.routes";
import userRoutes from "../modules/user/user.routes";
import couponRoutes from "../modules/coupon/coupon.routes";
import notificationRoutes from "../modules/notification/notification.routes";
import settingsRoutes from "../modules/settings/settings.routes";
import analyticsRoutes from "../modules/analytics/analytics.routes";
import tableRoutes from "../modules/table/table.routes";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Welcome to Apna Restorant API v1" });
});

router.use("/auth", authRoutes);
router.use("/menu", menuRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/users", userRoutes);
router.use("/coupons", couponRoutes);
router.use("/notifications", notificationRoutes);
router.use("/settings", settingsRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/tables", tableRoutes);

export default router;
