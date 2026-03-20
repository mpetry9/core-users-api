import { Request, Response, NextFunction } from "express";

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[Error] ${statusCode} - ${message}`);
  console.error(`[Stack] ${err.stack}`);

  // PostgreSQL specific errors
  if (err.name === "DatabaseError" || (err as any).code?.startsWith("23")) {
    res.status(400).json({
      error: "Database Error",
      message: "A database constraint was violated",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
    return;
  }

  res.status(statusCode).json({
    error: statusCode === 500 ? "Internal Server Error" : "Error",
    message:
      statusCode === 500 && process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
};
