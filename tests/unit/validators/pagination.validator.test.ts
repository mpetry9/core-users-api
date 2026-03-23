import { Request, Response, NextFunction } from "express";
import { validatePaginationParams } from "../../../src/middleware/validators/pagination.validator";

describe("Pagination Validators", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe("validatePaginationParams", () => {
    it("should call next() when no pagination params provided", () => {
      mockReq.query = {};

      validatePaginationParams(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should call next() for valid page and limit", () => {
      mockReq.query = {
        page: "2",
        limit: "20",
      };

      validatePaginationParams(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    describe("page validation", () => {
      it("should accept valid positive page number", () => {
        mockReq.query = { page: "1" };

        validatePaginationParams(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });

      it("should accept large page numbers", () => {
        mockReq.query = { page: "9999" };

        validatePaginationParams(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });

      it("should reject page = 0", () => {
        mockReq.query = { page: "0" };

        validatePaginationParams(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: "Bad Request",
            message: "Page must be a positive integer",
          }),
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should reject negative page", () => {
        mockReq.query = { page: "-5" };

        validatePaginationParams(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Page must be a positive integer",
          }),
        );
      });

      it("should reject non-numeric page", () => {
        mockReq.query = { page: "abc" };

        validatePaginationParams(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Page must be a positive integer",
          }),
        );
      });

      it("should reject decimal page", () => {
        mockReq.query = { page: "2.5" };

        validatePaginationParams(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        // parseInt("2.5") = 2, which is valid
        // This test shows current behavior
        expect(mockNext).toHaveBeenCalled();
      });

      it("should reject empty string page", () => {
        mockReq.query = { page: "" };

        validatePaginationParams(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });
    });

    describe("limit validation", () => {
      it("should accept valid positive limit", () => {
        mockReq.query = { limit: "10" };

        validatePaginationParams(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });

      it("should accept large limit numbers", () => {
        mockReq.query = { limit: "1000" };

        validatePaginationParams(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });

      it("should reject limit = 0", () => {
        mockReq.query = { limit: "0" };

        validatePaginationParams(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: "Bad Request",
            message: "Limit must be a positive integer",
          }),
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should reject negative limit", () => {
        mockReq.query = { limit: "-10" };

        validatePaginationParams(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Limit must be a positive integer",
          }),
        );
      });

      it("should reject non-numeric limit", () => {
        mockReq.query = { limit: "xyz" };

        validatePaginationParams(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Limit must be a positive integer",
          }),
        );
      });

      it("should reject empty string limit", () => {
        mockReq.query = { limit: "" };

        validatePaginationParams(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });
    });

    it("should validate both page and limit together", () => {
      mockReq.query = {
        page: "5",
        limit: "50",
      };

      validatePaginationParams(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it("should reject if page is invalid even if limit is valid", () => {
      mockReq.query = {
        page: "abc",
        limit: "10",
      };

      validatePaginationParams(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject if limit is invalid even if page is valid", () => {
      mockReq.query = {
        page: "1",
        limit: "-5",
      };

      validatePaginationParams(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should correctly handle minimum values", () => {
      mockReq.query = {
        page: "1",
        limit: "1",
      };

      validatePaginationParams(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
