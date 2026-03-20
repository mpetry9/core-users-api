import dotenv from "dotenv";

dotenv.config();

export const authConfig = {
  jwt: {
    secret:
      process.env.JWT_SECRET || "fallback-secret-key-change-in-production",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || "10", 10),
  },
  apiKey: {
    prefix: process.env.API_KEY_PREFIX || "sk_live_",
    length: parseInt(process.env.API_KEY_LENGTH || "32", 10),
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:5173",
    ],
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "5", 10),
  },
};

// Validation: Ensure JWT secret is properly set in production
if (
  process.env.NODE_ENV === "production" &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
) {
  throw new Error(
    "JWT_SECRET must be set and at least 32 characters long in production",
  );
}
