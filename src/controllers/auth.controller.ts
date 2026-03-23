import { Request, Response } from "express";
import UserModel from "../models/user.model";
import {
  AuthenticatedRequest,
  LoginRequest,
  RefreshTokenRequest,
  SignupRequest,
  TokenResponse,
  UserResponse,
} from "../types/auth.types";
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  verifyPassword,
  verifyToken,
} from "../utils/auth.util";

class AuthController {
  // ============================================
  // POST /auth/signup
  // Creates a new user account
  // ============================================
  async signup(
    req: Request<Record<string, never>, Record<string, never>, SignupRequest>,
    res: Response,
  ): Promise<void> {
    try {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          error: "Conflict",
          message: "Email already exists",
        });
        return;
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const user = await UserModel.createWithPassword({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        status: "active",
      });

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      const response: TokenResponse = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to create user account",
      });
    }
  }

  // ============================================
  // POST /auth/login
  // Authenticates user and returns tokens
  // ============================================
  async login(
    req: Request<Record<string, never>, Record<string, never>, LoginRequest>,
    res: Response,
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user by email (with password)
      const user = await UserModel.findByEmailWithPassword(
        email.toLowerCase().trim(),
      );

      if (!user) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Invalid email or password",
        });
        return;
      }

      // Check if user has a password set
      if (!user.password_hash) {
        res.status(401).json({
          error: "Unauthorized",
          message:
            "No password set for this account. Please use password reset.",
        });
        return;
      }

      // Verify password
      const isValidPassword = await verifyPassword(
        password,
        user.password_hash,
      );

      if (!isValidPassword) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Invalid email or password",
        });
        return;
      }

      // Check if user is active
      if (user.status !== "active") {
        res.status(401).json({
          error: "Unauthorized",
          message: "Account is not active",
        });
        return;
      }

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      const response: TokenResponse = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to login",
      });
    }
  }

  // ============================================
  // POST /auth/refresh
  // Refreshes access token using refresh token
  // ============================================
  async refresh(
    req: Request<
      Record<string, never>,
      Record<string, never>,
      RefreshTokenRequest
    >,
    res: Response,
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      let decoded;
      try {
        decoded = verifyToken(refreshToken);
      } catch (error) {
        res.status(401).json({
          error: "Unauthorized",
          message:
            error instanceof Error ? error.message : "Invalid refresh token",
        });
        return;
      }

      // Check if it's actually a refresh token
      if (decoded.type !== "refresh") {
        res.status(401).json({
          error: "Unauthorized",
          message: "Invalid token type. Expected refresh token.",
        });
        return;
      }

      // Verify user still exists and is active
      const user = await UserModel.findById(decoded.userId);

      if (!user) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User not found",
        });
        return;
      }

      if (user.status !== "active") {
        res.status(401).json({
          error: "Unauthorized",
          message: "User account is not active",
        });
        return;
      }

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      // Optionally generate new refresh token (rotation strategy)
      const newRefreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      const response: TokenResponse = {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to refresh token",
      });
    }
  }

  // ============================================
  // GET /auth/me
  // Returns current authenticated user
  // Requires authentication middleware
  // ============================================
  async getCurrentUser(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User not authenticated",
        });
        return;
      }

      // Fetch fresh user data from database
      const user = await UserModel.findById(req.user.id);

      if (!user) {
        res.status(404).json({
          error: "Not found",
          message: "User not found",
        });
        return;
      }

      const response: UserResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to get user data",
      });
    }
  }
}

export default new AuthController();
