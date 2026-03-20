import { Router } from "express";
import authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  validateSignup,
  validateLogin,
  validateRefreshToken,
} from "../middleware/validators/auth.validator";

const router = Router();

/**
 * @route   POST /auth/signup
 * @desc    Create a new user account
 * @access  Public
 */
router.post("/signup", validateSignup, authController.signup);

/**
 * @route   POST /auth/login
 * @desc    Authenticate user and get tokens
 * @access  Public
 */
router.post("/login", validateLogin, authController.login);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post("/refresh", validateRefreshToken, authController.refresh);

/**
 * @route   GET /auth/me
 * @desc    Get current authenticated user
 * @access  Private (requires JWT or API Key)
 */
router.get("/me", authenticate, authController.getCurrentUser);

export default router;
