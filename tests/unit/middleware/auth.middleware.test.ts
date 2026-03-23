import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../src/types/auth.types";
import UserModel from "../../../src/models/user.model";
import * as authUtil from "../../../src/utils/auth.util";

// Mock the models BEFORE importing authenticate
jest.mock("../../../src/models/user.model");

// Create the mock instance directly in the factory
jest.mock("../../../src/models/apiKey.model", () => {
  const mockInstance = {
    findByHash: jest.fn(),
    isExpired: jest.fn(),
    updateLastUsed: jest.fn().mockResolvedValue(undefined),
  };

  return jest.fn().mockImplementation(() => mockInstance);
});

// Import ApiKeyModel after mocking to get the mocked constructor
import ApiKeyModel from "../../../src/models/apiKey.model";

// Import authenticate AFTER all mocks are set up
import { authenticate } from "../../../src/middleware/auth.middleware";

// Get reference to the mock instance
const ApiKeyModelMock = ApiKeyModel as jest.MockedClass<typeof ApiKeyModel>;
const mockApiKeyModelInstance = new ApiKeyModelMock() as any;

describe("Auth Middleware", () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("authenticate middleware", () => {
    describe("Missing authorization header", () => {
      it("should return 401 when no authorization header", async () => {
        mockReq.headers = {};

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: "Unauthorized",
            message: "Authorization header is required",
          }),
        );
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe("Invalid authorization header format", () => {
      it("should return 401 for malformed header (no space)", async () => {
        mockReq.headers = {
          authorization: "Bearertoken123",
        };

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining(
              "Invalid authorization header format",
            ),
          }),
        );
      });

      it("should return 401 for unknown auth scheme", async () => {
        mockReq.headers = {
          authorization: "Basic dXNlcjpwYXNz",
        };

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message:
              'Invalid authorization header format. Use "Bearer <token>" or "ApiKey <key>"',
          }),
        );
      });
    });

    describe("JWT Authentication", () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      };

      it("should authenticate valid JWT token", async () => {
        const mockToken = "valid.jwt.token";
        mockReq.headers = {
          authorization: `Bearer ${mockToken}`,
        };

        jest.spyOn(authUtil, "verifyToken").mockReturnValue({
          userId: 1,
          email: "test@example.com",
          type: "access",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        });

        (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.user).toEqual({
          id: 1,
          name: "Test User",
          email: "test@example.com",
          status: "active",
        });
        expect(mockReq.authMethod).toBe("jwt");
      });

      it("should reject refresh token (not access token)", async () => {
        mockReq.headers = {
          authorization: "Bearer refresh.token",
        };

        jest.spyOn(authUtil, "verifyToken").mockReturnValue({
          userId: 1,
          email: "test@example.com",
          type: "refresh",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        });

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Invalid token type. Use an access token.",
          }),
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should reject JWT if user not found", async () => {
        mockReq.headers = {
          authorization: "Bearer valid.jwt.token",
        };

        jest.spyOn(authUtil, "verifyToken").mockReturnValue({
          userId: 999,
          email: "notfound@example.com",
          type: "access",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        });

        (UserModel.findById as jest.Mock).mockResolvedValue(null);

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "User not found",
          }),
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should reject JWT if user is not active", async () => {
        mockReq.headers = {
          authorization: "Bearer valid.jwt.token",
        };

        jest.spyOn(authUtil, "verifyToken").mockReturnValue({
          userId: 1,
          email: "test@example.com",
          type: "access",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        });

        (UserModel.findById as jest.Mock).mockResolvedValue({
          ...mockUser,
          status: "inactive",
        });

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "User account is not active",
          }),
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should reject expired JWT token", async () => {
        mockReq.headers = {
          authorization: "Bearer expired.jwt.token",
        };

        jest.spyOn(authUtil, "verifyToken").mockImplementation(() => {
          throw new Error("Token has expired");
        });

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Token has expired",
          }),
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should reject invalid JWT token", async () => {
        mockReq.headers = {
          authorization: "Bearer invalid.token",
        };

        jest.spyOn(authUtil, "verifyToken").mockImplementation(() => {
          throw new Error("Invalid token");
        });

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Invalid token",
          }),
        );
      });
    });

    describe("API Key Authentication", () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockApiKeyRecord = {
        id: 1,
        user_id: 1,
        key_hash: "hashed_key",
        name: "Test API Key",
        is_active: true,
        expires_at: null,
        created_at: new Date(),
        last_used_at: null,
      };

      beforeEach(() => {
        // Reset mock implementations for each test
        mockApiKeyModelInstance.findByHash.mockReset();
        mockApiKeyModelInstance.isExpired.mockReset();
        mockApiKeyModelInstance.updateLastUsed
          .mockReset()
          .mockResolvedValue(undefined);
      });

      it("should authenticate valid API key", async () => {
        const apiKey = "test_key_valid_mock_32chars_long";
        mockReq.headers = {
          authorization: `ApiKey ${apiKey}`,
        };

        jest.spyOn(authUtil, "isValidApiKeyFormat").mockReturnValue(true);
        jest.spyOn(authUtil, "hashApiKey").mockReturnValue("hashed_key");
        mockApiKeyModelInstance.findByHash.mockResolvedValue(mockApiKeyRecord);
        mockApiKeyModelInstance.isExpired.mockReturnValue(false);
        (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.user).toEqual({
          id: 1,
          name: "Test User",
          email: "test@example.com",
          status: "active",
        });
        expect(mockReq.authMethod).toBe("apiKey");
        expect(mockApiKeyModelInstance.updateLastUsed).toHaveBeenCalledWith(1);
      });

      it("should reject API key with invalid format", async () => {
        mockReq.headers = {
          authorization: "ApiKey invalid_format",
        };

        jest.spyOn(authUtil, "isValidApiKeyFormat").mockReturnValue(false);

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Invalid API key format",
          }),
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should reject API key not found in database", async () => {
        mockReq.headers = {
          authorization: "ApiKey test_key_notfound_mock_32chars",
        };

        jest.spyOn(authUtil, "isValidApiKeyFormat").mockReturnValue(true);
        jest.spyOn(authUtil, "hashApiKey").mockReturnValue("not_found_hash");
        mockApiKeyModelInstance.findByHash.mockResolvedValue(null);

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Invalid API key",
          }),
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should reject revoked API key", async () => {
        mockReq.headers = {
          authorization: "ApiKey test_key_revoked_mock_32chars",
        };

        jest.spyOn(authUtil, "isValidApiKeyFormat").mockReturnValue(true);
        jest.spyOn(authUtil, "hashApiKey").mockReturnValue("revoked_hash");
        mockApiKeyModelInstance.findByHash.mockResolvedValue({
          ...mockApiKeyRecord,
          is_active: false,
        });

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "API key has been revoked",
          }),
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should reject expired API key", async () => {
        mockReq.headers = {
          authorization: "ApiKey test_key_expired_mock_32chars",
        };

        jest.spyOn(authUtil, "isValidApiKeyFormat").mockReturnValue(true);
        jest.spyOn(authUtil, "hashApiKey").mockReturnValue("expired_hash");
        mockApiKeyModelInstance.findByHash.mockResolvedValue(mockApiKeyRecord);
        mockApiKeyModelInstance.isExpired.mockReturnValue(true);

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "API key has expired",
          }),
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should reject if user not found", async () => {
        mockReq.headers = {
          authorization: "ApiKey test_key_orphan_mock_32chars_",
        };

        jest.spyOn(authUtil, "isValidApiKeyFormat").mockReturnValue(true);
        jest.spyOn(authUtil, "hashApiKey").mockReturnValue("orphan_hash");
        mockApiKeyModelInstance.findByHash.mockResolvedValue(mockApiKeyRecord);
        mockApiKeyModelInstance.isExpired.mockReturnValue(false);
        (UserModel.findById as jest.Mock).mockResolvedValue(null);

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "User not found",
          }),
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should reject if user is inactive", async () => {
        mockReq.headers = {
          authorization: "ApiKey test_key_inactive_mock_32char",
        };

        jest.spyOn(authUtil, "isValidApiKeyFormat").mockReturnValue(true);
        jest.spyOn(authUtil, "hashApiKey").mockReturnValue("inactive_hash");
        mockApiKeyModelInstance.findByHash.mockResolvedValue(mockApiKeyRecord);
        mockApiKeyModelInstance.isExpired.mockReturnValue(false);
        (UserModel.findById as jest.Mock).mockResolvedValue({
          ...mockUser,
          status: "suspended",
        });

        await authenticate(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "User account is not active",
          }),
        );
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });
});
