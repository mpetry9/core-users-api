import { Pool, QueryResult } from "pg";
import Database from "../config/database";
import { ApiKey, ApiKeyResponse } from "../types/auth.types";
import { hashApiKey, getApiKeyPreview } from "../utils/auth.util";

class ApiKeyModel {
  private pool: Pool;
  private tableName = "api_keys";

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  /**
   * Creates a new API key in the database
   * @param userId - User ID
   * @param keyHash - Hashed API key
   * @param name - Friendly name for the key
   * @param expiresInDays - Optional expiration in days
   * @returns Created API key record
   */
  async create(
    userId: number,
    keyHash: string,
    name: string,
    expiresInDays?: number,
  ): Promise<ApiKey> {
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const query = `
      INSERT INTO ${this.tableName} (user_id, key_hash, name, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      userId,
      keyHash,
      name,
      expiresAt,
    ]);
    return result.rows[0] as ApiKey;
  }

  /**
   * Finds an API key by its hash
   * @param keyHash - Hashed API key
   * @returns API key record or null
   */
  async findByHash(keyHash: string): Promise<ApiKey | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE key_hash = $1 AND is_active = true
    `;

    const result = await this.pool.query(query, [keyHash]);
    return result.rows.length > 0 ? (result.rows[0] as ApiKey) : null;
  }

  /**
   * Finds all active API keys for a user
   * @param userId - User ID
   * @returns Array of API key records
   */
  async findByUserId(userId: number): Promise<ApiKey[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows as ApiKey[];
  }

  /**
   * Finds an API key by ID and user ID
   * @param id - API key ID
   * @param userId - User ID
   * @returns API key record or null
   */
  async findByIdAndUserId(id: number, userId: number): Promise<ApiKey | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE id = $1 AND user_id = $2
    `;

    const result = await this.pool.query(query, [id, userId]);
    return result.rows.length > 0 ? (result.rows[0] as ApiKey) : null;
  }

  /**
   * Updates the last_used_at timestamp for an API key
   * @param id - API key ID
   */
  async updateLastUsed(id: number): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET last_used_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.pool.query(query, [id]);
  }

  /**
   * Revokes (soft deletes) an API key
   * @param id - API key ID
   * @param userId - User ID (for authorization)
   * @returns True if revoked successfully
   */
  async revoke(id: number, userId: number): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName}
      SET is_active = false
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await this.pool.query(query, [id, userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Deletes expired API keys (cleanup job)
   * @returns Number of deleted keys
   */
  async deleteExpired(): Promise<number> {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP
    `;

    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }

  /**
   * Checks if an API key is expired
   * @param apiKey - API key record
   * @returns True if expired
   */
  isExpired(apiKey: ApiKey): boolean {
    if (!apiKey.expires_at) {
      return false;
    }
    return new Date(apiKey.expires_at) < new Date();
  }

  /**
   * Converts database record to API response format
   * @param apiKey - API key record
   * @param plainKey - Optional plain text key (only for creation)
   * @returns API key response object
   */
  toResponse(apiKey: ApiKey, plainKey?: string): ApiKeyResponse {
    const keyPreview = plainKey ? getApiKeyPreview(plainKey) : "***";

    return {
      id: apiKey.id,
      userId: apiKey.user_id,
      name: apiKey.name,
      key: plainKey, // Only included at creation
      keyPreview,
      createdAt: apiKey.created_at,
      lastUsedAt: apiKey.last_used_at,
      expiresAt: apiKey.expires_at,
      isActive: apiKey.is_active,
    };
  }
}

export default ApiKeyModel;
