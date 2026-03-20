import { Router } from "express";
import { getUsers, getUserById } from "../controllers/users.controller";
import { validatePaginationParams } from "../middleware/validators/pagination.validator";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Apply authentication to all user routes
router.use(authenticate);

/**
 * GET /api/users
 * Get paginated list of users
 * Query params: page (default: 1), limit (default: 10, max: 100)
 * @access Private (requires JWT or API Key)
 */
router.get("/", validatePaginationParams, getUsers);

/**
 * GET /api/users/:id
 * Get a single user by ID
 * @access Private (requires JWT or API Key)
 */
router.get("/:id", getUserById);

export default router;
