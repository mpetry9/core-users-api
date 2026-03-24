import Database from "../../../src/config/database";
import ApiKeyModel from "../../../src/models/apiKey.model";
import { ApiKey } from "../../../src/types/auth.types";
import {
  hashApiKey,
  generateTestApiKey,
  hashPassword,
} from "../../helpers/auth";
import {
  cleanDatabase,
  closeTestPool,
  getTestPool,
  query,
} from "../../helpers/database";

describe("ApiKeyModel", () => {
  let apiKeyModel: ApiKeyModel;
  let testUserId: number;

  beforeAll(async () => {
    const pool = getTestPool();
    await pool.query("SELECT 1");
    apiKeyModel = new ApiKeyModel();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create a test user
    const password = await hashPassword("Password123");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await query(
      "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Test User", "test@example.com", password, "active"],
    );
    testUserId = result.rows[0].id;
  });

  afterAll(async () => {
    await closeTestPool();
    const db = Database.getInstance();
    await db.close();
  });

  describe("create", () => {
    it("should create a new API key", async () => {
      const apiKey = generateTestApiKey();
      const keyHash = hashApiKey(apiKey);

      const result = await apiKeyModel.create(testUserId, keyHash, "Test Key");

      expect(result).toHaveProperty("id");
      expect(result.user_id).toBe(testUserId);
      expect(result.key_hash).toBe(keyHash);
      expect(result.name).toBe("Test Key");
      expect(result.expires_at).toBeNull();
      expect(result.is_active).toBe(true);
    });

    it("should create API key with expiration", async () => {
      const apiKey = generateTestApiKey();
      const keyHash = hashApiKey(apiKey);

      const result = await apiKeyModel.create(
        testUserId,
        keyHash,
        "Expiring Key",
        30,
      );

      expect(result.expires_at).not.toBeNull();
      const expiresAt = new Date(result.expires_at!);
      const expectedDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Check if dates are close (within 1 second)
      expect(
        Math.abs(expiresAt.getTime() - expectedDate.getTime()),
      ).toBeLessThan(1000);
    });

    it("should create API key without expiration when expiresInDays is undefined", async () => {
      const apiKey = generateTestApiKey();
      const keyHash = hashApiKey(apiKey);

      const result = await apiKeyModel.create(
        testUserId,
        keyHash,
        "Non-Expiring Key",
        undefined,
      );

      expect(result.expires_at).toBeNull();
    });
  });

  describe("findByHash", () => {
    it("should find an active API key by hash", async () => {
      const apiKey = generateTestApiKey();
      const keyHash = hashApiKey(apiKey);

      await apiKeyModel.create(testUserId, keyHash, "Test Key");

      const result = await apiKeyModel.findByHash(keyHash);

      expect(result).not.toBeNull();
      expect(result!.key_hash).toBe(keyHash);
      expect(result!.is_active).toBe(true);
    });

    it("should return null for non-existent hash", async () => {
      const fakeHash = "nonexistenthash123";

      const result = await apiKeyModel.findByHash(fakeHash);

      expect(result).toBeNull();
    });

    it("should not find inactive API keys", async () => {
      const apiKey = generateTestApiKey();
      const keyHash = hashApiKey(apiKey);

      const created = await apiKeyModel.create(testUserId, keyHash, "Test Key");

      // Deactivate the key
      await query("UPDATE api_keys SET is_active = false WHERE id = $1", [
        created.id,
      ]);

      const result = await apiKeyModel.findByHash(keyHash);

      expect(result).toBeNull();
    });
  });

  describe("findByUserId", () => {
    it("should find all active API keys for a user", async () => {
      // Create multiple API keys
      const apiKey1 = generateTestApiKey();
      const apiKey2 = generateTestApiKey();
      await apiKeyModel.create(testUserId, hashApiKey(apiKey1), "Key 1");
      await apiKeyModel.create(testUserId, hashApiKey(apiKey2), "Key 2");

      const result = await apiKeyModel.findByUserId(testUserId);

      expect(result).toHaveLength(2);
      expect(result[0].user_id).toBe(testUserId);
      expect(result[1].user_id).toBe(testUserId);
    });

    it("should return empty array when user has no API keys", async () => {
      const result = await apiKeyModel.findByUserId(testUserId);

      expect(result).toEqual([]);
    });

    it("should not return inactive API keys", async () => {
      const apiKey = generateTestApiKey();
      const keyHash = hashApiKey(apiKey);
      const created = await apiKeyModel.create(testUserId, keyHash, "Test Key");

      // Deactivate the key
      await query("UPDATE api_keys SET is_active = false WHERE id = $1", [
        created.id,
      ]);

      const result = await apiKeyModel.findByUserId(testUserId);

      expect(result).toEqual([]);
    });

    it("should return keys ordered by created_at DESC", async () => {
      const apiKey1 = generateTestApiKey();
      await apiKeyModel.create(testUserId, hashApiKey(apiKey1), "Old Key");

      await new Promise((resolve) => setTimeout(resolve, 10));

      const apiKey2 = generateTestApiKey();
      await apiKeyModel.create(testUserId, hashApiKey(apiKey2), "New Key");

      const result = await apiKeyModel.findByUserId(testUserId);

      expect(result[0].name).toBe("New Key");
      expect(result[1].name).toBe("Old Key");
    });
  });

  describe("findByIdAndUserId", () => {
    it("should find an API key by ID and user ID", async () => {
      const apiKey = generateTestApiKey();
      const created = await apiKeyModel.create(
        testUserId,
        hashApiKey(apiKey),
        "Test Key",
      );

      const result = await apiKeyModel.findByIdAndUserId(
        created.id,
        testUserId,
      );

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.user_id).toBe(testUserId);
    });

    it("should return null for wrong user ID", async () => {
      const apiKey = generateTestApiKey();
      const created = await apiKeyModel.create(
        testUserId,
        hashApiKey(apiKey),
        "Test Key",
      );

      const result = await apiKeyModel.findByIdAndUserId(created.id, 99999);

      expect(result).toBeNull();
    });

    it("should return null for non-existent ID", async () => {
      const result = await apiKeyModel.findByIdAndUserId(99999, testUserId);

      expect(result).toBeNull();
    });
  });

  describe("updateLastUsed", () => {
    it("should update the last_used_at timestamp", async () => {
      const apiKey = generateTestApiKey();
      const created = await apiKeyModel.create(
        testUserId,
        hashApiKey(apiKey),
        "Test Key",
      );

      expect(created.last_used_at).toBeNull();

      await apiKeyModel.updateLastUsed(created.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = (await query(
        "SELECT last_used_at FROM api_keys WHERE id = $1",
        [created.id],
      )) as any;

      expect(updated.rows[0].last_used_at).not.toBeNull();
    });
  });

  describe("revoke", () => {
    it("should revoke an API key", async () => {
      const apiKey = generateTestApiKey();
      const created = await apiKeyModel.create(
        testUserId,
        hashApiKey(apiKey),
        "Test Key",
      );

      const success = await apiKeyModel.revoke(created.id, testUserId);

      expect(success).toBe(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revoked = (await query(
        "SELECT is_active FROM api_keys WHERE id = $1",
        [created.id],
      )) as any;

      expect(revoked.rows[0].is_active).toBe(false);
    });

    it("should return false when revoking non-existent key", async () => {
      const success = await apiKeyModel.revoke(99999, testUserId);

      expect(success).toBe(false);
    });

    it("should return false when user ID does not match", async () => {
      const apiKey = generateTestApiKey();
      const created = await apiKeyModel.create(
        testUserId,
        hashApiKey(apiKey),
        "Test Key",
      );

      const success = await apiKeyModel.revoke(created.id, 99999);

      expect(success).toBe(false);
    });
  });

  describe("deleteExpired", () => {
    it("should delete expired API keys", async () => {
      const apiKey = generateTestApiKey();
      const keyHash = hashApiKey(apiKey);

      // Create an expired key by setting expires_at in the past
      await query(
        "INSERT INTO api_keys (user_id, key_hash, name, expires_at) VALUES ($1, $2, $3, $4)",
        [testUserId, keyHash, "Expired Key", new Date(Date.now() - 1000)],
      );

      const deleted = await apiKeyModel.deleteExpired();

      expect(deleted).toBe(1);

      const remaining = await query(
        "SELECT * FROM api_keys WHERE key_hash = $1",
        [keyHash],
      );

      expect((remaining as any).rows).toHaveLength(0);
    });

    it("should not delete keys without expiration", async () => {
      const apiKey = generateTestApiKey();
      await apiKeyModel.create(testUserId, hashApiKey(apiKey), "No Expiry");

      const deleted = await apiKeyModel.deleteExpired();

      expect(deleted).toBe(0);
    });

    it("should not delete keys that have not expired yet", async () => {
      const apiKey = generateTestApiKey();
      await apiKeyModel.create(
        testUserId,
        hashApiKey(apiKey),
        "Future Key",
        30,
      );

      const deleted = await apiKeyModel.deleteExpired();

      expect(deleted).toBe(0);
    });

    it("should return 0 when no expired keys exist", async () => {
      const deleted = await apiKeyModel.deleteExpired();

      expect(deleted).toBe(0);
    });
  });

  describe("isExpired", () => {
    it("should return true for expired API key", () => {
      const expiredKey: ApiKey = {
        id: 1,
        user_id: testUserId,
        key_hash: "hash",
        name: "Expired Key",
        expires_at: new Date(Date.now() - 1000),
        is_active: true,
        last_used_at: null,
        created_at: new Date(),
      };

      const result = apiKeyModel.isExpired(expiredKey);

      expect(result).toBe(true);
    });

    it("should return false for non-expired API key", () => {
      const activeKey: ApiKey = {
        id: 1,
        user_id: testUserId,
        key_hash: "hash",
        name: "Active Key",
        expires_at: new Date(Date.now() + 1000000),
        is_active: true,
        last_used_at: null,
        created_at: new Date(),
      };

      const result = apiKeyModel.isExpired(activeKey);

      expect(result).toBe(false);
    });

    it("should return false for API key without expiration", () => {
      const noExpiryKey: ApiKey = {
        id: 1,
        user_id: testUserId,
        key_hash: "hash",
        name: "No Expiry Key",
        expires_at: null,
        is_active: true,
        last_used_at: null,
        created_at: new Date(),
      };

      const result = apiKeyModel.isExpired(noExpiryKey);

      expect(result).toBe(false);
    });
  });

  describe("toResponse", () => {
    it("should convert API key to response format with plain key", () => {
      const apiKey: ApiKey = {
        id: 1,
        user_id: testUserId,
        key_hash: "hash",
        name: "Test Key",
        expires_at: null,
        is_active: true,
        last_used_at: null,
        created_at: new Date(),
      };

      const plainKey = generateTestApiKey();
      const response = apiKeyModel.toResponse(apiKey, plainKey);

      expect(response.id).toBe(1);
      expect(response.name).toBe("Test Key");
      expect(response.userId).toBe(testUserId);
      expect(response.key).toBe(plainKey);
      expect(response.keyPreview).toContain("...");
      expect(response.isActive).toBe(true);
    });

    it("should convert API key to response format without plain key", () => {
      const apiKey: ApiKey = {
        id: 1,
        user_id: testUserId,
        key_hash: "hash",
        name: "Test Key",
        expires_at: null,
        is_active: true,
        last_used_at: null,
        created_at: new Date(),
      };

      const response = apiKeyModel.toResponse(apiKey);

      expect(response.keyPreview).toBe("***");
      expect(response.key).toBeUndefined();
    });

    it("should include expiration date in response", () => {
      const expiresAt = new Date(Date.now() + 1000000);
      const apiKey: ApiKey = {
        id: 1,
        user_id: testUserId,
        key_hash: "hash",
        name: "Test Key",
        expires_at: expiresAt,
        is_active: true,
        last_used_at: null,
        created_at: new Date(),
      };

      const response = apiKeyModel.toResponse(apiKey);

      expect(response.expiresAt).toBe(expiresAt);
    });

    it("should include last used date in response", () => {
      const lastUsed = new Date();
      const apiKey: ApiKey = {
        id: 1,
        user_id: testUserId,
        key_hash: "hash",
        name: "Test Key",
        expires_at: null,
        is_active: true,
        last_used_at: lastUsed,
        created_at: new Date(),
      };

      const response = apiKeyModel.toResponse(apiKey);

      expect(response.lastUsedAt).toBe(lastUsed);
    });
  });
});
