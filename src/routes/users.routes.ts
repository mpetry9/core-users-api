import { Router } from "express";
import { getUsers, getUserById } from "../controllers/users.controller";
import { validatePaginationParams } from "../middleware/validators/pagination.validator";

const router = Router();

/**
 * GET /api/users
 * Get paginated list of users
 * Query params: page (default: 1), limit (default: 10, max: 100)
 */
router.get("/", validatePaginationParams, getUsers);

/**
 * GET /api/users/:id
 * Get a single user by ID
 */
router.get("/:id", getUserById);

export default router;
