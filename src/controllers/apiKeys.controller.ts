import { Request, Response } from "express";
import ApiKeyModel from "../models/apiKey.model";
import { generateApiKey, hashApiKey } from "../utils/auth.util";
import {
  AuthenticatedRequest,
  ApiKeyCreateRequest,
  ApiKeyResponse,
} from "../types/auth.types";

const apiKeyModel = new ApiKeyModel();

class ApiKeysController {
  // ============================================
  // POST /api/keys
  // Creates a new API key for the authenticated user
  // Requires JWT authentication
  // ============================================
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User not authenticated",
        });
        return;
      }

      // Only allow JWT authentication for API key creation (not API key auth)
      if (req.authMethod !== "jwt") {
        res.status(403).json({
          error: "Forbidden",
          message: "API key creation requires JWT authentication",
        });
        return;
      }

      const { name, expiresInDays } = req.body as ApiKeyCreateRequest;

      // Generate API key
      const apiKey = generateApiKey();
      const keyHash = hashApiKey(apiKey);

      // Store in database
      const apiKeyRecord = await apiKeyModel.create(
        req.user.id,
        keyHash,
        name.trim(),
        expiresInDays,
      );

      // Convert to response format (includes plaintext key only once)
      const response: ApiKeyResponse = apiKeyModel.toResponse(
        apiKeyRecord,
        apiKey,
      );

      res.status(201).json({
        ...response,
        message:
          "API key created successfully. Save it securely - it will not be shown again.",
      });
    } catch (error) {
      console.error("Create API key error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to create API key",
      });
    }
  }

  // ============================================
  // GET /api/keys
  // Lists all active API keys for the authenticated user
  // ============================================
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User not authenticated",
        });
        return;
      }

      // Fetch all active API keys for user
      const apiKeys = await apiKeyModel.findByUserId(req.user.id);

      // Convert to response format (without plaintext keys)
      const response: ApiKeyResponse[] = apiKeys.map((key) =>
        apiKeyModel.toResponse(key),
      );

      res.status(200).json({
        keys: response,
        total: response.length,
      });
    } catch (error) {
      console.error("List API keys error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to list API keys",
      });
    }
  }

  // ============================================
  // DELETE /api/keys/:id
  // Revokes (soft deletes) an API key
  // ============================================
  async revoke(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User not authenticated",
        });
        return;
      }

      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const keyId = parseInt(id, 10);

      if (isNaN(keyId)) {
        res.status(400).json({
          error: "Bad request",
          message: "Invalid API key ID",
        });
        return;
      }

      // Verify the API key belongs to the user
      const apiKey = await apiKeyModel.findByIdAndUserId(keyId, req.user.id);

      if (!apiKey) {
        res.status(404).json({
          error: "Not found",
          message: "API key not found",
        });
        return;
      }

      // Revoke the key
      const success = await apiKeyModel.revoke(keyId, req.user.id);

      if (!success) {
        res.status(500).json({
          error: "Internal server error",
          message: "Failed to revoke API key",
        });
        return;
      }

      res.status(200).json({
        message: "API key revoked successfully",
        id: keyId,
      });
    } catch (error) {
      console.error("Revoke API key error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to revoke API key",
      });
    }
  }

  // ============================================
  // GET /api/keys/:id
  // Gets details of a specific API key
  // ============================================
  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User not authenticated",
        });
        return;
      }

      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const keyId = parseInt(id, 10);

      if (isNaN(keyId)) {
        res.status(400).json({
          error: "Bad request",
          message: "Invalid API key ID",
        });
        return;
      }

      // Verify the API key belongs to the user
      const apiKey = await apiKeyModel.findByIdAndUserId(keyId, req.user.id);

      if (!apiKey) {
        res.status(404).json({
          error: "Not found",
          message: "API key not found",
        });
        return;
      }

      // Convert to response format
      const response: ApiKeyResponse = apiKeyModel.toResponse(apiKey);

      res.status(200).json(response);
    } catch (error) {
      console.error("Get API key error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to get API key",
      });
    }
  }
}

export default new ApiKeysController();
