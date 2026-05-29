import { Router } from "express";
import * as categoryController from "./category.controller";
import * as menuItemController from "./menuItem.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { upload } from "../../middleware/upload.middleware";

const router = Router();

// Category routes
router.get("/categories", categoryController.getAll);
router.post("/categories",
  authenticate, requireRole("admin"),
  upload.single("image"),
  categoryController.create
);
router.patch("/categories/:id",
  authenticate, requireRole("admin"),
  upload.single("image"),
  categoryController.update
);
router.delete("/categories/:id",
  authenticate, requireRole("admin"),
  categoryController.remove
);

// Menu Item routes
router.get("/items", menuItemController.getAll);
router.get("/items/:id", menuItemController.getById);
router.post("/items",
  authenticate, requireRole("admin"),
  upload.single("image"),
  menuItemController.create
);
router.patch("/items/:id",
  authenticate, requireRole("admin"),
  upload.single("image"),
  menuItemController.update
);
router.patch("/items/:id/toggle",
  authenticate, requireRole("admin"),
  menuItemController.toggleAvailability
);
router.delete("/items/:id",
  authenticate, requireRole("admin"),
  menuItemController.remove
);

export default router;
