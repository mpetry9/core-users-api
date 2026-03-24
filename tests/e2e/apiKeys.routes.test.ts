import request from "supertest";
import app from "../../src/app";
import Database from "../../src/config/database";
import { createAuthUser } from "../helpers/auth";
import { cleanDatabase, getTestPool, closeTestPool } from "../helpers/database";
import { createTestApiKeyData } from "../helpers/factories";

describe("API Keys Routes (E2E)", () => {
  let testUser: {
    user: { id: number; name: string; email: string; status: string };
    accessToken: string;
    refreshToken: string;
  };

  beforeAll(async () => {
    const pool = getTestPool();
    await pool.query("SELECT 1");
  });

  beforeEach(async () => {
    await cleanDatabase();
    // Create a test user for authentication
    testUser = await createAuthUser({
      name: "Test User",
      email: "test@example.com",
      password: "Password123",
    });
  });

  afterAll(async () => {
    // Close database connections when running this test file in isolation
    // This prevents "Jest did not exit" warnings
    try {
      await closeTestPool();
      const db = Database.getInstance();
      if (db) {
        await db.close();
      }
    } catch (error) {
      // Ignore errors if already closed by global teardown
    }
  });

  describe("POST /keys", () => {
    it("should create a new API key with valid JWT token", async () => {
      const apiKeyData = createTestApiKeyData({
        name: "My Test Key",
      });

      const response = await request(app)
        .post("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .send(apiKeyData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("key");
      expect(response.body.name).toBe("My Test Key");
      expect(response.body.userId).toBe(testUser.user.id);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("will not be shown again");
      expect(response.body.isActive).toBe(true);
      expect(response.body.keyPreview).toContain("...");
    });

    it("should create API key with expiration date", async () => {
      const apiKeyData = createTestApiKeyData({
        name: "Expiring Key",
        expiresInDays: 30,
      });

      const response = await request(app)
        .post("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .send(apiKeyData)
        .expect(201);

      expect(response.body).toHaveProperty("expiresAt");
      expect(response.body.expiresAt).not.toBeNull();
    });

    it("should create API key without expiration date", async () => {
      const apiKeyData = createTestApiKeyData({
        name: "Non-Expiring Key",
      });

      const response = await request(app)
        .post("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .send(apiKeyData)
        .expect(201);

      expect(response.body.expiresAt).toBeNull();
    });

    it("should reject API key creation without JWT authentication", async () => {
      const apiKeyData = createTestApiKeyData();

      const response = await request(app)
        .post("/keys")
        .send(apiKeyData)
        .expect(401);

      expect(response.body.error).toBe("Unauthorized");
    });

    it("should reject API key creation with API key authentication", async () => {
      // First, create an API key
      const createResponse = await request(app)
        .post("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .send(createTestApiKeyData({ name: "First Key" }))
        .expect(201);

      const apiKey = createResponse.body.key;

      // Try to create another API key using the first API key
      const response = await request(app)
        .post("/keys")
        .set("Authorization", `ApiKey ${apiKey}`)
        .send(createTestApiKeyData({ name: "Second Key" }))
        .expect(403);

      expect(response.body.error).toBe("Forbidden");
      expect(response.body.message).toContain("requires JWT authentication");
    });

    it.skip("should handle server errors gracefully", async () => {
      // Close the database to simulate an error
      await Database.getInstance().close();

      const apiKeyData = createTestApiKeyData();

      const response = await request(app)
        .post("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .send(apiKeyData)
        .expect(500);

      expect(response.body.error).toBe("Internal server error");
      expect(response.body.message).toContain("Failed to create API key");

      // Reconnect database for other tests
      Database.getInstance();
    });
  });

  describe("GET /keys", () => {
    it("should list all API keys for authenticated user", async () => {
      // Create multiple API keys
      await request(app)
        .post("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .send(createTestApiKeyData({ name: "Key 1" }));

      await request(app)
        .post("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .send(createTestApiKeyData({ name: "Key 2" }));

      const response = await request(app)
        .get("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(200);

      expect(response.body.keys).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.keys[0]).toHaveProperty("id");
      expect(response.body.keys[0]).not.toHaveProperty("key"); // Plain keys should not be included
      expect(response.body.keys[0].keyPreview).toBe("***");
    });

    it("should return empty list when user has no API keys", async () => {
      const response = await request(app)
        .get("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(200);

      expect(response.body.keys).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });

    it("should not show revoked API keys", async () => {
      // Create API key
      const createResponse = await request(app)
        .post("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .send(createTestApiKeyData({ name: "Key to Revoke" }));

      const keyId = createResponse.body.id;

      // Revoke it
      await request(app)
        .delete(`/keys/${keyId}`)
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(200);

      // List should be empty
      const response = await request(app)
        .get("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(200);

      expect(response.body.keys).toHaveLength(0);
    });

    it("should reject unauthorized requests", async () => {
      const response = await request(app).get("/keys").expect(401);

      expect(response.body.error).toBe("Unauthorized");
    });

    it.skip("should handle server errors gracefully", async () => {
      // Close the database to simulate an error
      await Database.getInstance().close();

      const response = await request(app)
        .get("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(500);

      expect(response.body.error).toBe("Internal server error");
      expect(response.body.message).toContain("Failed to list API keys");

      // Reconnect database for other tests
      Database.getInstance();
    });
  });

  describe("DELETE /keys/:id", () => {
    it("should revoke an existing API key", async () => {
      // Create API key
      const createResponse = await request(app)
        .post("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .send(createTestApiKeyData({ name: "Key to Revoke" }));

      const keyId = createResponse.body.id;

      // Revoke it
      const response = await request(app)
        .delete(`/keys/${keyId}`)
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(200);

      expect(response.body.message).toContain("revoked successfully");
      expect(response.body.id).toBe(keyId);
    });

    it("should reject invalid key ID", async () => {
      const response = await request(app)
        .delete("/keys/invalid")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(400);

      expect(response.body.error).toBe("Bad request");
      expect(response.body.message).toContain("Invalid API key ID");
    });

    it("should return 404 for non-existent key", async () => {
      const response = await request(app)
        .delete("/keys/99999")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(404);

      expect(response.body.error).toBe("Not found");
      expect(response.body.message).toContain("API key not found");
    });

    it("should not allow revoking another user's key", async () => {
      // Create another user
      const otherUser = await createAuthUser({
        email: "other@example.com",
      });

      // Create API key for other user
      const createResponse = await request(app)
        .post("/keys")
        .set("Authorization", `Bearer ${otherUser.accessToken}`)
        .send(createTestApiKeyData({ name: "Other User Key" }));

      const keyId = createResponse.body.id;

      // Try to revoke it with first user
      const response = await request(app)
        .delete(`/keys/${keyId}`)
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(404);

      expect(response.body.error).toBe("Not found");
    });

    it("should reject unauthorized requests", async () => {
      const response = await request(app).delete("/keys/1").expect(401);

      expect(response.body.error).toBe("Unauthorized");
    });

    it.skip("should handle server errors gracefully", async () => {
      // Create API key first
      const createResponse = await request(app)
        .post("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .send(createTestApiKeyData({ name: "Test Key" }));

      const keyId = createResponse.body.id;

      // Close the database to simulate an error
      await Database.getInstance().close();

      const response = await request(app)
        .delete(`/keys/${keyId}`)
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(500);

      expect(response.body.error).toBe("Internal server error");

      // Reconnect database for other tests
      Database.getInstance();
    });
  });

  describe("GET /keys/:id", () => {
    it("should get details of a specific API key", async () => {
      // Create API key
      const createResponse = await request(app)
        .post("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .send(createTestApiKeyData({ name: "Test Key" }));

      const keyId = createResponse.body.id;

      // Get details
      const response = await request(app)
        .get(`/keys/${keyId}`)
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(keyId);
      expect(response.body.name).toBe("Test Key");
      expect(response.body).not.toHaveProperty("key"); // Should not include plain key
      expect(response.body.keyPreview).toBe("***");
    });

    it("should reject invalid key ID", async () => {
      const response = await request(app)
        .get("/keys/invalid")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(400);

      expect(response.body.error).toBe("Bad request");
      expect(response.body.message).toContain("Invalid API key ID");
    });

    it("should return 404 for non-existent key", async () => {
      const response = await request(app)
        .get("/keys/99999")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(404);

      expect(response.body.error).toBe("Not found");
      expect(response.body.message).toContain("API key not found");
    });

    it("should not allow accessing another user's key", async () => {
      // Create another user
      const otherUser = await createAuthUser({
        email: "other@example.com",
      });

      // Create API key for other user
      const createResponse = await request(app)
        .post("/keys")
        .set("Authorization", `Bearer ${otherUser.accessToken}`)
        .send(createTestApiKeyData({ name: "Other User Key" }));

      const keyId = createResponse.body.id;

      // Try to access it with first user
      const response = await request(app)
        .get(`/keys/${keyId}`)
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(404);

      expect(response.body.error).toBe("Not found");
    });

    it("should reject unauthorized requests", async () => {
      const response = await request(app).get("/keys/1").expect(401);

      expect(response.body.error).toBe("Unauthorized");
    });

    it.skip("should handle server errors gracefully", async () => {
      // Create API key first
      const createResponse = await request(app)
        .post("/keys")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .send(createTestApiKeyData({ name: "Test Key" }));

      const keyId = createResponse.body.id;

      // Close the database to simulate an error
      await Database.getInstance().close();

      const response = await request(app)
        .get(`/keys/${keyId}`)
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(500);

      expect(response.body.error).toBe("Internal server error");

      // Reconnect database for other tests
      Database.getInstance();
    });
  });
});
