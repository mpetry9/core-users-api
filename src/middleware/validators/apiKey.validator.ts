import { Request, Response, NextFunction } from "express";

// ============================================
// API Key Creation Validator
// ============================================

export function validateApiKeyCreation(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { name, expiresInDays } = req.body;
  const errors: string[] = [];

  // Validate name
  if (!name || typeof name !== "string") {
    errors.push("Name is required and must be a string");
  } else if (name.trim().length < 3) {
    errors.push("Name must be at least 3 characters long");
  } else if (name.length > 100) {
    errors.push("Name must not exceed 100 characters");
  }

  // Validate expiresInDays (optional)
  if (expiresInDays !== undefined) {
    if (typeof expiresInDays !== "number" || !Number.isInteger(expiresInDays)) {
      errors.push("expiresInDays must be an integer");
    } else if (expiresInDays < 1) {
      errors.push("expiresInDays must be at least 1");
    } else if (expiresInDays > 3650) {
      errors.push("expiresInDays must not exceed 3650 (10 years)");
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
    return;
  }

  next();
}
