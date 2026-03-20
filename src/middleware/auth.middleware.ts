import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth.types";
import {
  verifyToken,
  extractAuthToken,
  hashApiKey,
  isValidApiKeyFormat,
} from "../utils/auth.util";
import UserModel from "../models/user.model";
import ApiKeyModel from "../models/apiKey.model";

const apiKeyModel = new ApiKeyModel();

// ============================================
// Authentication Middleware (JWT + API Key)
// ============================================

/**
 * Middleware that authenticates requests using either JWT or API Key
 * Supports two authentication methods:
 * - Bearer token (JWT): Authorization: Bearer <token>
 * - API Key: Authorization: ApiKey <key>
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authorization header is required",
      });
      return;
    }

    const { type, token } = extractAuthToken(authHeader);

    if (!type || !token) {
      res.status(401).json({
        error: "Unauthorized",
        message:
          'Invalid authorization header format. Use "Bearer <token>" or "ApiKey <key>"',
      });
      return;
    }

    // Handle JWT authentication
    if (type === "bearer") {
      await authenticateWithJWT(req, res, next, token);
      return;
    }

    // Handle API Key authentication
    if (type === "apiKey") {
      await authenticateWithApiKey(req, res, next, token);
      return;
    }

    res.status(401).json({
      error: "Unauthorized",
      message: "Unsupported authentication method",
    });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Authentication failed",
    });
  }
}

// ============================================
// JWT Authentication
// ============================================

async function authenticateWithJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  token: string,
): Promise<void> {
  try {
    const decoded = verifyToken(token);

    // Only accept access tokens, not refresh tokens
    if (decoded.type !== "access") {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token type. Use an access token.",
      });
      return;
    }

    // Fetch user from database to ensure they still exist and are active
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not found",
      });
      return;
    }

    if (user.status !== "active") {
      res.status(401).json({
        error: "Unauthorized",
        message: "User account is not active",
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
    };
    req.authMethod = "jwt";

    next();
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({
        error: "Unauthorized",
        message: error.message,
      });
    } else {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
    }
  }
}

// ============================================
// API Key Authentication
// ============================================

async function authenticateWithApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  apiKey: string,
): Promise<void> {
  try {
    // Validate API key format
    if (!isValidApiKeyFormat(apiKey)) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid API key format",
      });
      return;
    }

    // Hash the API key to compare with stored hash
    const keyHash = hashApiKey(apiKey);

    // Find API key in database
    const apiKeyRecord = await apiKeyModel.findByHash(keyHash);

    if (!apiKeyRecord) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid API key",
      });
      return;
    }

    // Check if API key is active
    if (!apiKeyRecord.is_active) {
      res.status(401).json({
        error: "Unauthorized",
        message: "API key has been revoked",
      });
      return;
    }

    // Check if API key is expired
    if (apiKeyModel.isExpired(apiKeyRecord)) {
      res.status(401).json({
        error: "Unauthorized",
        message: "API key has expired",
      });
      return;
    }

    // Fetch user associated with the API key
    const user = await UserModel.findById(apiKeyRecord.user_id);

    if (!user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not found",
      });
      return;
    }

    if (user.status !== "active") {
      res.status(401).json({
        error: "Unauthorized",
        message: "User account is not active",
      });
      return;
    }

    // Update last_used_at timestamp (async, don't await)
    apiKeyModel.updateLastUsed(apiKeyRecord.id).catch((err) => {
      console.error("Failed to update API key last_used_at:", err);
    });

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
    };
    req.authMethod = "apiKey";

    next();
  } catch (error) {
    console.error("API key authentication error:", error);
    res.status(401).json({
      error: "Unauthorized",
      message: "API key authentication failed",
    });
  }
}

// ============================================
// Optional Authentication Middleware
// ============================================

/**
 * Optional authentication middleware
 * Attaches user if authenticated, but doesn't require authentication
 */
export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // No authentication provided, continue without user
    next();
    return;
  }

  // Try to authenticate, but don't fail if it doesn't work
  try {
    await authenticate(req, res, next);
  } catch {
    // Authentication failed, continue without user
    next();
  }
}
