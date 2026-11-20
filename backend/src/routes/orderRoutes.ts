// src/routes/orderRoutes.ts
import { Router } from "express";
import * as orderController from "../controllers/orderController";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateRequest } from "../middleware/validateRequest";
import {
  createOrderSchema,
  updateOrderStatusSchema
} from "../schemas/orderSchemas";

const router = Router();

// All order endpoints require an authenticated user.
router.use(authenticate);

// Order responses contain customer and transaction information.
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");

  next();
});

// Customer-facing order routes.
router.post(
  "/",
  validateRequest(createOrderSchema),
  orderController.createOrder
);

router.get("/me", orderController.listMyOrders);

// Operational order routes — administrators and staff only.
router.get("/", authorize("admin", "staff"), orderController.listAllOrders);

router.patch(
  "/:id/status",
  authorize("admin", "staff"),
  validateRequest(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

export default router;
