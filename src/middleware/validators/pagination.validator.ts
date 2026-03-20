import { Request, Response, NextFunction } from "express";

export const validatePaginationParams = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page as string, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      res.status(400).json({
        error: "Bad Request",
        message: "Page must be a positive integer",
      });
      return;
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1) {
      res.status(400).json({
        error: "Bad Request",
        message: "Limit must be a positive integer",
      });
      return;
    }
  }

  next();
};
