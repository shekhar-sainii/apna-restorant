import { Router } from "express";
import { getSettings, updateSettings } from "./settings.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

router.get("/", authenticate, requireRole("admin"), getSettings);
router.patch("/", authenticate, requireRole("admin"), updateSettings);

export default router;
