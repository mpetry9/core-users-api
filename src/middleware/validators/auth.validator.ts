import { Request, Response, NextFunction } from "express";

// ============================================
// Validation Helper Functions
// ============================================

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordMinLength = 8;

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  return emailRegex.test(email);
}

/**
 * Validates password strength
 * Requirements: minimum 8 characters, at least one letter and one number
 */
function isValidPassword(password: string): boolean {
  if (password.length < passwordMinLength) {
    return false;
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

// ============================================
// Signup Validator
// ============================================

export function validateSignup(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { name, email, password } = req.body;
  const errors: string[] = [];

  // Validate name
  if (!name || typeof name !== "string") {
    errors.push("Name is required and must be a string");
  } else if (name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  } else if (name.length > 100) {
    errors.push("Name must not exceed 100 characters");
  }

  // Validate email
  if (!email || typeof email !== "string") {
    errors.push("Email is required and must be a string");
  } else if (!isValidEmail(email)) {
    errors.push("Email must be a valid email address");
  }

  // Validate password
  if (!password || typeof password !== "string") {
    errors.push("Password is required and must be a string");
  } else if (!isValidPassword(password)) {
    errors.push(
      `Password must be at least ${passwordMinLength} characters long and contain at least one letter and one number`,
    );
  } else if (password.length > 128) {
    errors.push("Password must not exceed 128 characters");
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

// ============================================
// Login Validator
// ============================================

export function validateLogin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { email, password } = req.body;
  const errors: string[] = [];

  // Validate email
  if (!email || typeof email !== "string") {
    errors.push("Email is required and must be a string");
  } else if (!isValidEmail(email)) {
    errors.push("Email must be a valid email address");
  }

  // Validate password
  if (!password || typeof password !== "string") {
    errors.push("Password is required and must be a string");
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

// ============================================
// Refresh Token Validator
// ============================================

export function validateRefreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { refreshToken } = req.body;
  const errors: string[] = [];

  if (!refreshToken || typeof refreshToken !== "string") {
    errors.push("Refresh token is required and must be a string");
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
