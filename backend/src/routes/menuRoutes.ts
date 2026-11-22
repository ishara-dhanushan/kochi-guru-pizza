// src/routes/menuRoutes.ts
import { Router } from "express";
import * as menuController from "@controllers/menuController";
import { authenticate } from "@middleware/authenticate";
import { authorize } from "@middleware/authorize";
import { validateRequest } from "@middleware/validateRequest";
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  getMenuItemSchema,
  deleteMenuItemSchema,
  listMenuItemsSchema
} from "@schemas/menuSchemas";

const router = Router();

// Public routes
router.get(
  "/",
  validateRequest(listMenuItemsSchema),
  menuController.listMenuItems
);
router.get(
  "/:id",
  validateRequest(getMenuItemSchema),
  menuController.getMenuItem
);

// Protected routes — admin and staff can create and update
router.post(
  "/",
  authenticate,
  authorize("admin", "staff"),
  validateRequest(createMenuItemSchema),
  menuController.createMenuItem
);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "staff"),
  validateRequest(updateMenuItemSchema),
  menuController.updateMenuItem
);

// Delete — admin only
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validateRequest(deleteMenuItemSchema),
  menuController.deleteMenuItem
);

export default router;
