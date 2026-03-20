import { Router } from "express";
import apiKeysController from "../controllers/apiKeys.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateApiKeyCreation } from "../middleware/validators/apiKey.validator";

const router = Router();

// All API key routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/keys
 * @desc    Create a new API key
 * @access  Private (requires JWT authentication)
 */
router.post("/", validateApiKeyCreation, apiKeysController.create);

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
