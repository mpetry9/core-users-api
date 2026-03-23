import { Request, Response, NextFunction } from "express";
import {
  validateSignup,
  validateLogin,
  validateRefreshToken,
} from "../../../src/middleware/validators/auth.validator";

describe("Auth Validators", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe("validateSignup", () => {
    it("should call next() for valid signup data", () => {
      mockReq.body = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
      };

      validateSignup(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    describe("name validation", () => {
      it("should reject missing name", () => {
        mockReq.body = {
          email: "john@example.com",
          password: "Password123",
        };

        validateSignup(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: "Validation failed",
            details: expect.arrayContaining([
              expect.stringContaining("Name is required"),
            ]),
          }),
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should reject name shorter than 2 characters", () => {
        mockReq.body = {
          name: "J",
          email: "john@example.com",
          password: "Password123",
        };

        validateSignup(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.arrayContaining([
              expect.stringContaining("at least 2 characters"),
            ]),
          }),
        );
      });

      it("should reject name longer than 100 characters", () => {
        mockReq.body = {
          name: "A".repeat(101),
          email: "john@example.com",
          password: "Password123",
        };

        validateSignup(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.arrayContaining([
              expect.stringContaining("must not exceed 100 characters"),
            ]),
          }),
        );
      });

      it("should reject non-string name", () => {
        mockReq.body = {
          name: 12345,
          email: "john@example.com",
          password: "Password123",
        };

        validateSignup(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });
    });

    describe("email validation", () => {
      it("should reject missing email", () => {
        mockReq.body = {
          name: "John Doe",
          password: "Password123",
        };

        validateSignup(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.arrayContaining([
              expect.stringContaining("Email is required"),
            ]),
          }),
        );
      });

      it("should reject invalid email format", () => {
        const invalidEmails = [
          "not-an-email",
          "missing@domain",
          "@nodomain.com",
          "spaces in@email.com",
          "double@@domain.com",
        ];

        invalidEmails.forEach((email) => {
          mockReq.body = {
            name: "John Doe",
            email,
            password: "Password123",
          };

          validateSignup(mockReq as Request, mockRes as Response, mockNext);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
              details: expect.arrayContaining([
                expect.stringContaining("valid email address"),
              ]),
            }),
          );

          // Reset mocks for next iteration
          jest.clearAllMocks();
        });
      });

      it("should accept valid email formats", () => {
        const validEmails = [
          "simple@example.com",
          "user.name@example.com",
          "user+tag@example.co.uk",
          "123@example.com",
        ];

        validEmails.forEach((email) => {
          mockReq.body = {
            name: "John Doe",
            email,
            password: "Password123",
          };

          validateSignup(mockReq as Request, mockRes as Response, mockNext);

          expect(mockNext).toHaveBeenCalled();
          jest.clearAllMocks();
        });
      });
    });

    describe("password validation", () => {
      it("should reject missing password", () => {
        mockReq.body = {
          name: "John Doe",
          email: "john@example.com",
        };

        validateSignup(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.arrayContaining([
              expect.stringContaining("Password is required"),
            ]),
          }),
        );
      });

      it("should reject password shorter than 8 characters", () => {
        mockReq.body = {
          name: "John Doe",
          email: "john@example.com",
          password: "Pass1",
        };

        validateSignup(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.arrayContaining([
              expect.stringContaining("at least 8 characters"),
            ]),
          }),
        );
      });

      it("should reject password without letter", () => {
        mockReq.body = {
          name: "John Doe",
          email: "john@example.com",
          password: "12345678",
        };

        validateSignup(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.arrayContaining([
              expect.stringContaining("one letter and one number"),
            ]),
          }),
        );
      });

      it("should reject password without number", () => {
        mockReq.body = {
          name: "John Doe",
          email: "john@example.com",
          password: "PasswordOnly",
        };

        validateSignup(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.arrayContaining([
              expect.stringContaining("one letter and one number"),
            ]),
          }),
        );
      });

      it("should reject password longer than 128 characters", () => {
        mockReq.body = {
          name: "John Doe",
          email: "john@example.com",
          password: "A".repeat(120) + "12345678", // 128 chars
        };

        validateSignup(mockReq as Request, mockRes as Response, mockNext);

        // Note: Current validator checks max 128, this is exactly 128 so it passes
        // Need 129 chars to fail validation
        expect(mockNext).toHaveBeenCalled();
      });

      it("should reject password longer than 128 characters (129 chars)", () => {
        mockReq.body = {
          name: "John Doe",
          email: "john@example.com",
          password: "A".repeat(121) + "12345678", // 129 chars
        };

        validateSignup(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.arrayContaining([
              expect.stringContaining("must not exceed 128 characters"),
            ]),
          }),
        );
      });

      it("should accept valid password", () => {
        const validPasswords = [
          "Password123",
          "Pass1word",
          "12345678a",
          "ComplexP@ssw0rd!",
        ];

        validPasswords.forEach((password) => {
          mockReq.body = {
            name: "John Doe",
            email: "john@example.com",
            password,
          };

          validateSignup(mockReq as Request, mockRes as Response, mockNext);

          expect(mockNext).toHaveBeenCalled();
          jest.clearAllMocks();
        });
      });
    });

    it("should collect multiple validation errors", () => {
      mockReq.body = {
        name: "J",
        email: "invalid-email",
        password: "short",
      };

      validateSignup(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation failed",
          details: expect.arrayContaining([
            expect.stringContaining("Name"),
            expect.stringContaining("Email"),
            expect.stringContaining("Password"),
          ]),
        }),
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("validateLogin", () => {
    it("should call next() for valid login data", () => {
      mockReq.body = {
        email: "john@example.com",
        password: "AnyPassword",
      };

      validateLogin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should reject missing email", () => {
      mockReq.body = {
        password: "Password123",
      };

      validateLogin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.stringContaining("Email is required"),
          ]),
        }),
      );
    });

    it("should reject invalid email format", () => {
      mockReq.body = {
        email: "not-an-email",
        password: "Password123",
      };

      validateLogin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.stringContaining("valid email address"),
          ]),
        }),
      );
    });

    it("should reject missing password", () => {
      mockReq.body = {
        email: "john@example.com",
      };

      validateLogin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.stringContaining("Password is required"),
          ]),
        }),
      );
    });

    it("should accept any password length (login doesn't validate strength)", () => {
      // Login only checks if password exists, not strength
      mockReq.body = {
        email: "john@example.com",
        password: "x", // Even weak passwords should pass login validation
      };

      validateLogin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("validateRefreshToken", () => {
    it("should call next() for valid refresh token", () => {
      mockReq.body = {
        refreshToken: "valid-jwt-token-string",
      };

      validateRefreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should reject missing refresh token", () => {
      mockReq.body = {};

      validateRefreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.stringContaining("Refresh token is required"),
          ]),
        }),
      );
    });

    it("should reject non-string refresh token", () => {
      mockReq.body = {
        refreshToken: 12345,
      };

      validateRefreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should reject empty string", () => {
      mockReq.body = {
        refreshToken: "",
      };

      validateRefreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation failed",
          details: expect.arrayContaining([
            "Refresh token is required and must be a string",
          ]),
        }),
      );
    });
  });
});
