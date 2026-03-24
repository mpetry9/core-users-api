import { Router } from "express";
import apiKeysController from "../controllers/apiKeys.controller";
import { authenticate, requireJWT } from "../middleware/auth.middleware";
import { validateApiKeyCreation } from "../middleware/validators/apiKey.validator";

const router = Router();

/**
 * @route   POST /api/keys
 * @desc    Create a new API key
 * @access  Private (requires JWT authentication)
 */
router.post("/", requireJWT, validateApiKeyCreation, apiKeysController.create);

// All other API key routes require authentication (JWT or API Key)
router.use(authenticate);

/**
 * @route   GET /api/keys
 * @desc    List all API keys for the authenticated user
 * @access  Private (requires JWT or API Key authentication)
 */
router.get("/", apiKeysController.list);

/**
 * @route   GET /api/keys/:id
 * @desc    Get details of a specific API key
 * @access  Private (requires JWT or API Key authentication)
 */
router.get("/:id", apiKeysController.getById);

/**
 * @route   DELETE /api/keys/:id
 * @desc    Revoke an API key
 * @access  Private (requires JWT or API Key authentication)
 */
router.delete("/:id", apiKeysController.revoke);

export default router;
