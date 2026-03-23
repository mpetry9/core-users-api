import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authConfig } from "../../src/config/auth";
import { query } from "./database";

/**
 * Generate a test JWT token
 */
export function generateTestJWT(
  userId: number,
  type: "access" | "refresh" = "access",
  expiresIn?: string,
): string {
  const payload = {
    userId,
    type,
  };

  const expiry =
    expiresIn ||
    (type === "access"
      ? authConfig.jwt.accessExpiresIn
      : authConfig.jwt.refreshExpiresIn);

  return jwt.sign(payload, authConfig.jwt.secret, { expiresIn: expiry });
}

/**
 * Generate an expired JWT token for testing
 */
export function generateExpiredJWT(
  userId: number,
  type: "access" | "refresh" = "access",
): string {
  const payload = {
    userId,
    type,
  };

  return jwt.sign(payload, authConfig.jwt.secret, { expiresIn: "-1h" });
}

/**
 * Generate a malformed JWT token
 */
export function generateMalformedJWT(): string {
  return "invalid.jwt.token";
}

/**
 * Generate a test API key (plaintext)
 */
export function generateTestApiKey(): string {
  const randomPart = crypto
    .randomBytes(authConfig.apiKey.length / 2)
    .toString("hex");
  return `${authConfig.apiKey.prefix}${randomPart}`;
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Hash a password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, authConfig.bcrypt.rounds);
}

/**
 * Create a test user with authentication in the database
 * Returns both the user data and a valid access token
 */
export async function createAuthUser(overrides?: {
  name?: string;
  email?: string;
  password?: string;
  status?: string;
}): Promise<{
  user: { id: number; name: string; email: string; status: string };
  accessToken: string;
  refreshToken: string;
}> {
  const name = overrides?.name || "Test User";
  const email = overrides?.email || `test${Date.now()}@example.com`;
  const password = overrides?.password || "Password123";
  const status = overrides?.status || "active";

  const passwordHash = await hashPassword(password);

  const result = await query(
    "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4) RETURNING id, name, email, status, created_at, updated_at",
    [name, email, passwordHash, status],
  );

  const user = result.rows[0];

  const accessToken = generateTestJWT(user.id, "access");
  const refreshToken = generateTestJWT(user.id, "refresh");

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Create a test API key in the database
 * Returns both the plaintext key and the database record
 */
export async function createTestApiKeyInDb(
  userId: number,
  overrides?: {
    name?: string;
    expiresInDays?: number;
    isActive?: boolean;
  },
): Promise<{
  apiKey: string;
  record: {
    id: number;
    user_id: number;
    key_hash: string;
    name: string;
    is_active: boolean;
    expires_at: Date | null;
  };
}> {
  const apiKey = generateTestApiKey();
  const keyHash = hashApiKey(apiKey);
  const name = overrides?.name || "Test API Key";
  const isActive =
    overrides?.isActive !== undefined ? overrides.isActive : true;

  let expiresAt = null;
  if (overrides?.expiresInDays) {
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + overrides.expiresInDays);
    expiresAt = expireDate;
  }

  const result = await query(
    "INSERT INTO api_keys (user_id, key_hash, name, expires_at, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [userId, keyHash, name, expiresAt, isActive],
  );

  return {
    apiKey,
    record: result.rows[0],
  };
}
