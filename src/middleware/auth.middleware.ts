import { NextFunction, Response } from "express";
import ApiKeyModel from "../models/apiKey.model";
import UserModel from "../models/user.model";
import { AuthenticatedRequest } from "../types/auth.types";
import {
  extractAuthToken,
  hashApiKey,
  isValidApiKeyFormat,
  verifyToken,
} from "../utils/auth.util";

const apiKeyModel = new ApiKeyModel();

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
// Optional Authentication Middleware
// ============================================

/**
 * Optional authentication middleware
 * Attaches user if authenticated, but doesn't require authentication
 * If authentication fails, continues without user (no error response)
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

  // Save original response methods
  const originalStatus = res.status.bind(res);
  const originalJson = res.json.bind(res);

  // Create new methods that don't actually send responses
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (res as any).status = function (_code: number) {
    // Silently ignore error responses in optional authentication
    return res;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (res as any).json = function (_body: unknown) {
    // Silently ignore error responses in optional authentication
    return res;
  };

  // Create a custom next function to intercept authenticate's success callback
  const customNext: NextFunction = () => {
    // Authentication succeeded, but we don't need to track this
  };

  // Call authenticate with custom next
  await authenticate(req, res, customNext);

  // Restore original methods
  res.status = originalStatus;
  res.json = originalJson;

  // Always call the real next, regardless of authentication result
  // If auth succeeded: req.user is set and customNext was called
  // If auth failed: req.user is not set and error response was suppressed
  next();
}

// ============================================
// JWT-Only Authentication Middleware
// ============================================

/**
 * Middleware that requires JWT authentication only (rejects API key authentication)
 * This is used for operations that should only be performed with JWT tokens,
 * such as creating new API keys.
 */
export async function requireJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // First authenticate the request (accepts both JWT and API key)
  await authenticate(req, res, () => {
    // If authentication succeeded, check if it was JWT
    if (req.authMethod === "apiKey") {
      res.status(403).json({
        error: "Forbidden",
        message: "This operation requires JWT authentication",
      });
      return;
    }

    // JWT authentication confirmed, proceed
    next();
  });
}
