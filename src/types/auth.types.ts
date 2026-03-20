import { Request } from "express";
import { User } from "./user.types";

// ============================================
// Authentication Request/Response Types
// ============================================

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  status: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ============================================
// API Key Types
// ============================================

export interface ApiKeyCreateRequest {
  name: string;
  expiresInDays?: number; // Optional: number of days until expiration
}

export interface ApiKeyResponse {
  id: number;
  userId: number;
  name: string;
  key?: string; // Only provided once at creation
  keyPreview: string; // First 8 chars + '...' for display
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
}

export interface ApiKey {
  id: number;
  user_id: number;
  key_hash: string;
  name: string;
  created_at: Date;
  last_used_at: Date | null;
  expires_at: Date | null;
  is_active: boolean;
}

// ============================================
// JWT Payload Types
// ============================================

export interface JWTPayload {
  userId: number;
  email: string;
  type: "access" | "refresh";
}

export interface DecodedToken {
  userId: number;
  email: string;
  type: "access" | "refresh";
  iat: number;
  exp: number;
}

// ============================================
// Extended Request Types
// ============================================

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    status: string;
  };
  authMethod?: "jwt" | "apiKey";
}

// ============================================
// User with Password (for internal use)
// ============================================

export interface UserWithPassword extends User {
  password_hash: string;
}
