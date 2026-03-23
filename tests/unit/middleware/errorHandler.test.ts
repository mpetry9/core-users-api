import { Request, Response, NextFunction } from "express";
import {
  errorHandler,
  notFoundHandler,
} from "../../../src/middleware/errorHandler";

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

describe("Error Handler Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockReq = {
      method: "GET",
      url: "/test",
      path: "/test",
    } as Request;
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Spy on console.error to suppress output during tests
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("errorHandler", () => {
    it("should handle error with status code", () => {
      const error = new Error("Test error") as ErrorWithStatus;
      error.status = 400;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Error",
          message: "Test error",
        }),
      );
    });

    it("should handle error with statusCode field", () => {
      const error = new Error("Custom error") as ErrorWithStatus;
      error.statusCode = 403;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Error",
          message: "Custom error",
        }),
      );
    });

    it("should default to 500 for errors without status", () => {
      const error = new Error("Internal error");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Internal Server Error",
        }),
      );
    });

    it("should handle database constraint errors", () => {
      const error = new Error("Unique constraint violation") as ErrorWithStatus;
      error.name = "DatabaseError";
      error.code = "23505";

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Database Error",
          message: "A database constraint was violated",
        }),
      );
    });

    it("should handle PostgreSQL code 23xxx errors", () => {
      const error = new Error("Foreign key violation") as ErrorWithStatus;
      error.code = "23503";

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Database Error",
          message: "A database constraint was violated",
        }),
      );
    });

    it("should include stack trace in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("Dev error") as ErrorWithStatus;
      error.status = 400;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: expect.any(String),
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should not include stack trace in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Prod error") as ErrorWithStatus;
      error.status = 400;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const jsonCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it("should mask 500 error messages in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Sensitive internal error");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Something went wrong",
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should show actual message for 500 errors in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("Detailed internal error");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Detailed internal error",
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should log error to console", () => {
      const error = new Error("Log test error") as ErrorWithStatus;
      error.status = 400;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Error] 400 - Log test error"),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Stack]"),
      );
    });

    it("should handle error without message", () => {
      const error = new Error() as ErrorWithStatus;
      error.status = 500;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Internal Server Error",
          message: expect.any(String), // Empty string or default message
        }),
      );
    });

    it("should include database error details in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("Duplicate key violation") as ErrorWithStatus;
      error.name = "DatabaseError";
      error.code = "23505";

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: "Duplicate key violation",
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should not include database error details in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Duplicate key violation") as ErrorWithStatus;
      error.name = "DatabaseError";
      error.code = "23505";

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const jsonCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("notFoundHandler", () => {
    it("should return 404 for not found routes", () => {
      mockReq = {
        method: "GET",
        path: "/api/nonexistent",
        url: "/api/nonexistent",
      } as Request;

      notFoundHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Not Found",
          message: "Route GET /api/nonexistent not found",
        }),
      );
    });

    it("should include method in error message", () => {
      mockReq = { method: "POST", path: "/test", url: "/test" } as Request;

      notFoundHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Route POST /test not found",
        }),
      );
    });

    it("should handle different HTTP methods", () => {
      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

      methods.forEach((method) => {
        mockReq = { method, path: "/test/path", url: "/test/path" } as Request;
        jest.clearAllMocks();

        notFoundHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: `Route ${method} /test/path not found`,
          }),
        );
      });
    });

    it("should always return 404 status", () => {
      notFoundHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should not call next()", () => {
      notFoundHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
