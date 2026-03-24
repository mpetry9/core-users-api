import jwt, { JwtPayload } from "jsonwebtoken";
import { authConfig } from "../../../src/config/auth";
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  getApiKeyPreview,
  isValidApiKeyFormat,
  extractAuthToken,
} from "../../../src/utils/auth.util";

describe("Auth Utilities", () => {
  describe("Password Utilities", () => {
    describe("hashPassword", () => {
      it("should hash a password", async () => {
        const password = "Password123";
        const hash = await hashPassword(password);

        expect(hash).toBeDefined();
        expect(hash).not.toBe(password);
        expect(hash.length).toBeGreaterThan(0);
      });

      it("should generate different hashes for same password (bcrypt salt)", async () => {
        const password = "Password123";
        const hash1 = await hashPassword(password);
        const hash2 = await hashPassword(password);

        expect(hash1).not.toBe(hash2);
      });

      it("should handle empty string", async () => {
        const hash = await hashPassword("");
        expect(hash).toBeDefined();
      });
    });

    describe("verifyPassword", () => {
      it("should verify correct password", async () => {
        const password = "Password123";
        const hash = await hashPassword(password);
        const isValid = await verifyPassword(password, hash);

        expect(isValid).toBe(true);
      });

      it("should reject incorrect password", async () => {
        const password = "Password123";
        const hash = await hashPassword(password);
        const isValid = await verifyPassword("WrongPassword", hash);

        expect(isValid).toBe(false);
      });

      it("should reject empty password against valid hash", async () => {
        const password = "Password123";
        const hash = await hashPassword(password);
        const isValid = await verifyPassword("", hash);

        expect(isValid).toBe(false);
      });
    });
  });

  describe("JWT Utilities", () => {
    describe("generateAccessToken", () => {
      it("should generate a valid access token", () => {
        const payload = { userId: 1, email: "test@example.com" };
        const token = generateAccessToken(payload);

        expect(token).toBeDefined();
        expect(typeof token).toBe("string");
        expect(token.split(".").length).toBe(3); // JWT has 3 parts
      });

      it("should include userId and type in token payload", () => {
        const payload = { userId: 123, email: "user@example.com" };
        const token = generateAccessToken(payload);
        const decoded = jwt.decode(token) as JwtPayload;

        expect(decoded.userId).toBe(123);
        expect(decoded.type).toBe("access");
      });

      it("should set expiration time", () => {
        const payload = { userId: 1, email: "test@example.com" };
        const token = generateAccessToken(payload);
        const decoded = jwt.decode(token) as JwtPayload;

        expect(decoded.exp).toBeDefined();
        expect(decoded.iat).toBeDefined();
        expect(decoded.exp).toBeGreaterThan(decoded.iat!);
      });
    });

    describe("generateRefreshToken", () => {
      it("should generate a valid refresh token", () => {
        const payload = { userId: 1, email: "test@example.com" };
        const token = generateRefreshToken(payload);

        expect(token).toBeDefined();
        expect(typeof token).toBe("string");
        expect(token.split(".").length).toBe(3);
      });

      it("should include type 'refresh' in payload", () => {
        const payload = { userId: 456, email: "refresh@example.com" };
        const token = generateRefreshToken(payload);
        const decoded = jwt.decode(token) as JwtPayload;

        expect(decoded.userId).toBe(456);
        expect(decoded.type).toBe("refresh");
      });

      it("should have longer expiration than access token", () => {
        const payload = { userId: 1, email: "test@example.com" };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        const accessDecoded = jwt.decode(accessToken) as JwtPayload;
        const refreshDecoded = jwt.decode(refreshToken) as JwtPayload;

        const accessExpiry = accessDecoded.exp! - accessDecoded.iat!;
        const refreshExpiry = refreshDecoded.exp! - refreshDecoded.iat!;

        expect(refreshExpiry).toBeGreaterThan(accessExpiry);
      });
    });

    describe("verifyToken", () => {
      it("should verify and decode valid token", () => {
        const payload = { userId: 1, email: "test@example.com" };
        const token = generateAccessToken(payload);
        const decoded = verifyToken(token);

        expect(decoded.userId).toBe(1);
        expect(decoded.type).toBe("access");
      });

      it("should throw error for expired token", () => {
        const payload = {
          userId: 1,
          email: "test@example.com",
          type: "access" as const,
        };
        const expiredToken = jwt.sign(payload, authConfig.jwt.secret, {
          expiresIn: "-1h",
        });

        expect(() => verifyToken(expiredToken)).toThrow("Token has expired");
      });

      it("should throw error for invalid token", () => {
        expect(() => verifyToken("invalid.token.here")).toThrow(
          "Invalid token",
        );
      });

      it("should throw error for token with wrong secret", () => {
        const payload = {
          userId: 1,
          email: "test@example.com",
          type: "access" as const,
        };
        const wrongToken = jwt.sign(payload, "wrong-secret");

        expect(() => verifyToken(wrongToken)).toThrow("Invalid token");
      });

      it("should throw error for malformed token", () => {
        expect(() => verifyToken("not-even-close")).toThrow("Invalid token");
      });
    });

    describe("decodeToken", () => {
      it("should decode token without verification", () => {
        const payload = { userId: 789, email: "decode@example.com" };
        const token = generateAccessToken(payload);
        const decoded = decodeToken(token);

        expect(decoded).toBeDefined();
        expect(decoded?.userId).toBe(789);
      });

      it("should return null for invalid token", () => {
        const decoded = decodeToken("invalid.token");
        expect(decoded).toBeNull();
      });

      it("should decode expired token (no verification)", () => {
        const payload = {
          userId: 1,
          email: "test@example.com",
          type: "access" as const,
        };
        const expiredToken = jwt.sign(payload, authConfig.jwt.secret, {
          expiresIn: "-1h",
        });

        const decoded = decodeToken(expiredToken);
        expect(decoded).toBeDefined();
        expect(decoded?.userId).toBe(1);
      });
    });
  });

  describe("API Key Utilities", () => {
    describe("generateApiKey", () => {
      it("should generate an API key with correct prefix", () => {
        const apiKey = generateApiKey();

        expect(apiKey).toBeDefined();
        expect(apiKey.startsWith(authConfig.apiKey.prefix)).toBe(true);
      });

      it("should generate API keys of expected length", () => {
        const apiKey = generateApiKey();
        const expectedLength =
          authConfig.apiKey.prefix.length + authConfig.apiKey.length;

        expect(apiKey.length).toBeGreaterThanOrEqual(expectedLength - 5); // Allow some variance in base64 encoding
      });

      it("should generate unique API keys", () => {
        const key1 = generateApiKey();
        const key2 = generateApiKey();
        const key3 = generateApiKey();

        expect(key1).not.toBe(key2);
        expect(key2).not.toBe(key3);
        expect(key1).not.toBe(key3);
      });
    });

    describe("hashApiKey", () => {
      it("should hash an API key", () => {
        const apiKey = "sk_test_abcdef123456";
        const hash = hashApiKey(apiKey);

        expect(hash).toBeDefined();
        expect(hash).not.toBe(apiKey);
        expect(hash.length).toBe(64); // SHA-256 produces 64 char hex string
      });

      it("should generate same hash for same key", () => {
        const apiKey = "sk_test_abcdef123456";
        const hash1 = hashApiKey(apiKey);
        const hash2 = hashApiKey(apiKey);

        expect(hash1).toBe(hash2);
      });

      it("should generate different hashes for different keys", () => {
        const key1 = "sk_test_key1";
        const key2 = "sk_test_key2";
        const hash1 = hashApiKey(key1);
        const hash2 = hashApiKey(key2);

        expect(hash1).not.toBe(hash2);
      });
    });

    describe("verifyApiKey", () => {
      it("should verify correct API key", () => {
        const apiKey = "sk_test_abcdef123456";
        const hash = hashApiKey(apiKey);
        const isValid = verifyApiKey(apiKey, hash);

        expect(isValid).toBe(true);
      });

      it("should reject incorrect API key", () => {
        const apiKey = "sk_test_abcdef123456";
        const wrongKey = "sk_test_wrongkey999";
        const hash = hashApiKey(apiKey);
        const isValid = verifyApiKey(wrongKey, hash);

        expect(isValid).toBe(false);
      });

      it("should use timing-safe comparison", () => {
        // This test verifies the function doesn't throw
        // Actual timing-safe verification is internal to crypto
        const apiKey = generateApiKey();
        const hash = hashApiKey(apiKey);

        expect(() => verifyApiKey(apiKey, hash)).not.toThrow();
      });
    });

    describe("getApiKeyPreview", () => {
      it("should create preview for long API key", () => {
        const apiKey = "pk_preview_abcdef123456789012345678";
        const preview = getApiKeyPreview(apiKey);

        expect(preview).toBe("pk_preview_a...");
        expect(preview.length).toBeLessThan(apiKey.length);
      });

      it("should return full key for short keys", () => {
        const apiKey = "short";
        const preview = getApiKeyPreview(apiKey);

        expect(preview).toBe(apiKey);
      });

      it("should return full key for exactly 12 chars", () => {
        const apiKey = "exactlytw12c";
        const preview = getApiKeyPreview(apiKey);

        expect(preview).toBe(apiKey);
      });
    });

    describe("isValidApiKeyFormat", () => {
      it("should validate correct API key format", () => {
        const apiKey = `${authConfig.apiKey.prefix}${"a".repeat(20)}`;
        const isValid = isValidApiKeyFormat(apiKey);

        expect(isValid).toBe(true);
      });

      it("should reject key without correct prefix", () => {
        const apiKey = "wrong_prefix_abcdef123456789012345678";
        const isValid = isValidApiKeyFormat(apiKey);

        expect(isValid).toBe(false);
      });

      it("should reject key that is too short", () => {
        const apiKey = `${authConfig.apiKey.prefix}short`;
        const isValid = isValidApiKeyFormat(apiKey);

        expect(isValid).toBe(false);
      });
    });
  });

  describe("Token Extraction Utilities", () => {
    describe("extractAuthToken", () => {
      it("should extract Bearer token", () => {
        const authHeader = "Bearer my.jwt.token";
        const result = extractAuthToken(authHeader);

        expect(result.type).toBe("bearer");
        expect(result.token).toBe("my.jwt.token");
      });

      it("should extract ApiKey token", () => {
        const authHeader = "ApiKey sk_test_abc123";
        const result = extractAuthToken(authHeader);

        expect(result.type).toBe("apiKey");
        expect(result.token).toBe("sk_test_abc123");
      });

      it("should be case-insensitive for scheme", () => {
        const result1 = extractAuthToken("bearer token123");
        const result2 = extractAuthToken("BEARER token456");
        const result3 = extractAuthToken("BeArEr token789");

        expect(result1.type).toBe("bearer");
        expect(result2.type).toBe("bearer");
        expect(result3.type).toBe("bearer");
      });

      it("should return null for undefined header", () => {
        const result = extractAuthToken(undefined);

        expect(result.type).toBeNull();
        expect(result.token).toBeNull();
      });

      it("should return null for malformed header (no space)", () => {
        const result = extractAuthToken("Bearertoken123");

        expect(result.type).toBeNull();
        expect(result.token).toBeNull();
      });

      it("should return null for malformed header (too many parts)", () => {
        const result = extractAuthToken("Bearer token extra");

        expect(result.type).toBeNull();
        expect(result.token).toBeNull();
      });

      it("should return null for unsupported scheme", () => {
        const result = extractAuthToken("Basic dXNlcjpwYXNz");

        expect(result.type).toBeNull();
        expect(result.token).toBeNull();
      });
    });
  });

  describe("Error handling edge cases", () => {
    describe("verifyToken with unknown error", () => {
      it("should rethrow unknown errors", () => {
        // Mock jwt.verify to throw an unknown error
        const originalVerify = jwt.verify;
        jest.spyOn(jwt, "verify").mockImplementation(() => {
          throw new Error("Unknown JWT error");
        });

        expect(() => verifyToken("some.token")).toThrow("Unknown JWT error");

        // Restore original
        jwt.verify = originalVerify;
      });
    });
  });
});
