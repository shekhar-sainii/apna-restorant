import { Router } from "express";
import { getSummary } from "./analytics.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

router.get("/summary", authenticate, requireRole("admin", "staff"), getSummary);

export default router;
