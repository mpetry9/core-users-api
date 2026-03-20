import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { authConfig } from "../config/auth";
import { JWTPayload, DecodedToken } from "../types/auth.types";

// ============================================
// Password Utilities
// ============================================

/**
 * Hashes a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, authConfig.bcrypt.rounds);
}

/**
 * Verifies a password against a hash
 * @param password - Plain text password
 * @param hash - Bcrypt hash
 * @returns True if password matches hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
// JWT Utilities
// ============================================

/**
 * Generates a JWT access token
 * @param payload - Token payload
 * @returns Signed JWT token
 */
export function generateAccessToken(payload: Omit<JWTPayload, "type">): string {
  const tokenPayload: JWTPayload = {
    ...payload,
    type: "access",
  };

  const options: SignOptions = {
    expiresIn: authConfig.jwt.accessExpiresIn as any,
  };

  return jwt.sign(tokenPayload, authConfig.jwt.secret, options);
}

/**
 * Generates a JWT refresh token
 * @param payload - Token payload
 * @returns Signed JWT refresh token
 */
export function generateRefreshToken(
  payload: Omit<JWTPayload, "type">,
): string {
  const tokenPayload: JWTPayload = {
    ...payload,
    type: "refresh",
  };

  const options: SignOptions = {
    expiresIn: authConfig.jwt.refreshExpiresIn as any,
  };

  return jwt.sign(tokenPayload, authConfig.jwt.secret, options);
}

/**
 * Verifies and decodes a JWT token
 * @param token - JWT token
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): DecodedToken {
  try {
    return jwt.verify(token, authConfig.jwt.secret) as DecodedToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw error;
  }
}

/**
 * Decodes a JWT token without verification (use with caution)
 * @param token - JWT token
 * @returns Decoded token payload or null
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
}

// ============================================
// API Key Utilities
// ============================================

/**
 * Generates a random API key with prefix
 * @returns API key in format: prefix_randomString
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(authConfig.apiKey.length);
  const randomString = randomBytes
    .toString("base64")
    .replace(/[+/=]/g, "") // Remove special chars
    .substring(0, authConfig.apiKey.length);

  return `${authConfig.apiKey.prefix}${randomString}`;
}

/**
 * Hashes an API key using SHA-256
 * @param apiKey - Plain text API key
 * @returns Hashed API key
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Verifies an API key against a hash
 * @param apiKey - Plain text API key
 * @param hash - SHA-256 hash
 * @returns True if API key matches hash
 */
export function verifyApiKey(apiKey: string, hash: string): boolean {
  const keyHash = hashApiKey(apiKey);
  return crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(hash));
}

/**
 * Creates a preview of an API key (first 8 chars + '...')
 * @param apiKey - API key
 * @returns Preview string
 */
export function getApiKeyPreview(apiKey: string): string {
  if (apiKey.length <= 12) {
    return apiKey;
  }
  return `${apiKey.substring(0, 12)}...`;
}

/**
 * Validates API key format
 * @param apiKey - API key to validate
 * @returns True if API key has valid format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  return (
    apiKey.startsWith(authConfig.apiKey.prefix) &&
    apiKey.length >= authConfig.apiKey.prefix.length + 20
  );
}

// ============================================
// Token Extraction Utilities
// ============================================

/**
 * Extracts token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Object with token type and value
 */
export function extractAuthToken(authHeader: string | undefined): {
  type: "bearer" | "apiKey" | null;
  token: string | null;
} {
  if (!authHeader) {
    return { type: null, token: null };
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    return { type: null, token: null };
  }

  const [scheme, token] = parts;
  const lowerScheme = scheme.toLowerCase();

  if (lowerScheme === "bearer") {
    return { type: "bearer", token };
  }

  if (lowerScheme === "apikey") {
    return { type: "apiKey", token };
  }

  return { type: null, token: null };
}
