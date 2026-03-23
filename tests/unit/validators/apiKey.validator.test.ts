import { Request, Response, NextFunction } from "express";
import { validateApiKeyCreation } from "../../../src/middleware/validators/apiKey.validator";

describe("API Key Validators", () => {
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

  describe("validateApiKeyCreation", () => {
    it("should call next() for valid API key data", () => {
      mockReq.body = {
        name: "Production API Key",
      };

      validateApiKeyCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should call next() for valid API key with expiration", () => {
      mockReq.body = {
        name: "Production API Key",
        expiresInDays: 365,
      };

      validateApiKeyCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    describe("name validation", () => {
      it("should reject missing name", () => {
        mockReq.body = {};

        validateApiKeyCreation(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

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

      it("should reject name shorter than 3 characters", () => {
        mockReq.body = {
          name: "AB",
        };

        validateApiKeyCreation(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.arrayContaining([
              expect.stringContaining("at least 3 characters"),
            ]),
          }),
        );
      });

      it("should reject name longer than 100 characters", () => {
        mockReq.body = {
          name: "A".repeat(101),
        };

        validateApiKeyCreation(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

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
        };

        validateApiKeyCreation(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.arrayContaining([
              expect.stringContaining("Name is required"),
            ]),
          }),
        );
      });

      it("should reject name with only whitespace", () => {
        mockReq.body = {
          name: "   ",
        };

        validateApiKeyCreation(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.arrayContaining([
              expect.stringContaining("at least 3 characters"),
            ]),
          }),
        );
      });

      it("should accept name at minimum length (3 chars)", () => {
        mockReq.body = {
          name: "ABC",
        };

        validateApiKeyCreation(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });

      it("should accept name at maximum length (100 chars)", () => {
        mockReq.body = {
          name: "A".repeat(100),
        };

        validateApiKeyCreation(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe("expiresInDays validation", () => {
      it("should accept undefined expiresInDays (optional field)", () => {
        mockReq.body = {
          name: "Test Key",
        };

        validateApiKeyCreation(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });

      it("should accept valid expiresInDays", () => {
        const validValues = [1, 30, 365, 3650];

        validValues.forEach((days) => {
          mockReq.body = {
            name: "Test Key",
            expiresInDays: days,
          };

          validateApiKeyCreation(
            mockReq as Request,
            mockRes as Response,
            mockNext,
          );

          expect(mockNext).toHaveBeenCalled();
          jest.clearAllMocks();
        });
      });

      it("should reject non-integer expiresInDays", () => {
        mockReq.body = {
          name: "Test Key",
          expiresInDays: 30.5,
        };

        validateApiKeyCreation(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.arrayContaining([
              expect.stringContaining("must be an integer"),
            ]),
          }),
        );
      });

      it("should reject string expiresInDays", () => {
        mockReq.body = {
          name: "Test Key",
          expiresInDays: "30",
        };

        validateApiKeyCreation(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.arrayContaining([
              expect.stringContaining("must be an integer"),
            ]),
          }),
        );
      });

      it("should reject expiresInDays less than 1", () => {
        const invalidValues = [0, -1, -100];

        invalidValues.forEach((days) => {
          mockReq.body = {
            name: "Test Key",
            expiresInDays: days,
          };

          validateApiKeyCreation(
            mockReq as Request,
            mockRes as Response,
            mockNext,
          );

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
              details: expect.arrayContaining([
                expect.stringContaining("must be at least 1"),
              ]),
            }),
          );
          jest.clearAllMocks();
        });
      });

      it("should reject expiresInDays greater than 3650", () => {
        mockReq.body = {
          name: "Test Key",
          expiresInDays: 3651,
        };

        validateApiKeyCreation(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.arrayContaining([
              expect.stringContaining("must not exceed 3650"),
            ]),
          }),
        );
      });

      it("should accept minimum value (1 day)", () => {
        mockReq.body = {
          name: "Test Key",
          expiresInDays: 1,
        };

        validateApiKeyCreation(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });

      it("should accept maximum value (3650 days)", () => {
        mockReq.body = {
          name: "Test Key",
          expiresInDays: 3650,
        };

        validateApiKeyCreation(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });
    });

    it("should collect multiple validation errors", () => {
      mockReq.body = {
        name: "AB", // Too short
        expiresInDays: -1, // Invalid
      };

      validateApiKeyCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation failed",
          details: expect.arrayContaining([
            expect.stringContaining("Name"),
            expect.stringContaining("expiresInDays"),
          ]),
        }),
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
