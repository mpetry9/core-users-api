import { Router } from "express";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/orders.controller";
import { validatePaginationParams } from "../middleware/validators/pagination.validator";

const router = Router();

/**
 * GET /api/orders
 * Get paginated list of orders
 * Query params: page (default: 1), limit (default: 10, max: 100)
 */
router.get("/", validatePaginationParams, getOrders);

/**
 * GET /api/orders/:id
 * Get a single order by ID
 */
router.get("/:id", getOrderById);

/**
 * POST /api/orders
 * Create a new order
 * Body: { user_id: number, total_amount: number, status?: string }
 */
router.post("/", createOrder);

/**
 * PUT /api/orders/:id
 * Update an existing order
 * Body: { user_id?: number, total_amount?: number, status?: string }
 */
router.put("/:id", updateOrder);

/**
 * DELETE /api/orders/:id
 * Delete an order
 */
router.delete("/:id", deleteOrder);

export default router;
