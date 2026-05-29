import { Router } from "express";
import * as ctrl from "./table.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

// Public — QR scan validation
router.get("/number/:tableNumber", ctrl.getByNumber);

// Admin
router.use(authenticate, requireRole("admin", "staff"));
router.get("/", ctrl.getAll);
router.post("/", requireRole("admin"), ctrl.create);
router.patch("/:id", requireRole("admin"), ctrl.update);
router.delete("/:id", requireRole("admin"), ctrl.remove);

export default router;
