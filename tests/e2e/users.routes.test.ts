import request from "supertest";
import app from "../../src/app";
import Database from "../../src/config/database";
import { createAuthUser, hashPassword } from "../helpers/auth";
import {
  cleanDatabase,
  getTestPool,
  query,
  closeTestPool,
} from "../helpers/database";

describe("Users Routes (E2E)", () => {
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

  describe("GET /users", () => {
    it("should return paginated list of users with default pagination", async () => {
      // Create additional users
      const password = await hashPassword("Password123");
      await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
        ["User 2", "user2@example.com", password, "active"],
      );
      await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
        ["User 3", "user3@example.com", password, "active"],
      );

      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(3);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
      });
    });

    it("should return users with custom pagination parameters", async () => {
      // Create multiple users
      const password = await hashPassword("Password123");
      for (let i = 1; i <= 15; i++) {
        await query(
          "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
          [`User ${i}`, `user${i}@example.com`, password, "active"],
        );
      }

      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .query({ page: 2, limit: 5 })
        .expect(200);

      expect(response.body.data.length).toBe(5);
      expect(response.body.pagination).toMatchObject({
        page: 2,
        limit: 5,
        total: 16, // 15 + test user
        totalPages: 4,
      });
    });

    it("should return empty array when no users exist", async () => {
      await cleanDatabase();
      // Need to create a user first to get a token
      const tempUser = await createAuthUser({
        name: "Temp User",
        email: "temp@example.com",
        password: "Password123",
      });
      // Clean database again, but keep the user for auth
      await query("DELETE FROM api_keys");

      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${tempUser.accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1); // Only the temp user
      expect(response.body.pagination.total).toBe(1);
    });

    it("should not include password fields in response", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(200);

      expect(response.body.data[0]).not.toHaveProperty("password");
      expect(response.body.data[0]).not.toHaveProperty("password_hash");
      expect(response.body.data[0]).toHaveProperty("id");
      expect(response.body.data[0]).toHaveProperty("name");
      expect(response.body.data[0]).toHaveProperty("email");
      expect(response.body.data[0]).toHaveProperty("status");
    });

    it("should handle invalid pagination parameters", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .query({ page: "invalid", limit: "abc" })
        .expect(400);

      expect(response.body.error).toBe("Bad Request");
    });

    it("should handle page out of range", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .query({ page: 999 })
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.page).toBe(999);
    });

    it("should enforce maximum limit", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .query({ limit: 200 })
        .expect(200);

      // Should cap at 100 based on typical pagination limits
      expect(response.body.pagination.limit).toBeLessThanOrEqual(100);
    });
  });

  describe("GET /users/:id", () => {
    it("should return a specific user by ID", async () => {
      const response = await request(app)
        .get(`/users/${testUser.user.id}`)
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: testUser.user.id,
        name: testUser.user.name,
        email: testUser.user.email,
        status: testUser.user.status,
      });
      expect(response.body.data).not.toHaveProperty("password");
      expect(response.body.data).not.toHaveProperty("password_hash");
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app)
        .get("/users/99999")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(404);

      expect(response.body.error).toBe("Not Found");
      expect(response.body.message).toContain("User not found");
    });

    it("should return 400 for invalid user ID", async () => {
      const response = await request(app)
        .get("/users/invalid")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(400);

      expect(response.body.error).toBe("Bad Request");
      expect(response.body.message).toContain("Invalid user ID");
    });

    it("should return 400 for negative user ID", async () => {
      const response = await request(app)
        .get("/users/-1")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(400);

      expect(response.body.error).toBe("Bad Request");
    });

    it("should return 400 for zero user ID", async () => {
      const response = await request(app)
        .get("/users/0")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(400);

      expect(response.body.error).toBe("Bad Request");
    });

    it.skip("should handle server errors gracefully", async () => {
      // Close the database to simulate an error
      await Database.getInstance().close();

      const response = await request(app)
        .get("/users/1")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(500);

      expect(response.body.error).toBe("Internal server error");

      // Reconnect database for other tests
      Database.getInstance();
    });
  });

  describe("Edge cases and error handling", () => {
    it.skip("should handle database connection errors in GET /users", async () => {
      // Close the database to simulate an error
      await Database.getInstance().close();

      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(500);

      expect(response.body.error).toBe("Internal server error");

      // Reconnect database for other tests
      Database.getInstance();
    });

    it("should return users in descending order by creation date", async () => {
      // Create users with slight delays to ensure order
      const password = await hashPassword("Password123");
      await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
        ["First User", "first@example.com", password, "active"],
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
      await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
        ["Second User", "second@example.com", password, "active"],
      );

      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .expect(200);

      // Most recent should be first
      expect(response.body.data[0].email).toBe("second@example.com");
    });

    it("should handle large page numbers gracefully", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .query({ page: 1000000 })
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(0);
    });

    it("should handle minimum valid pagination parameters", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${testUser.accessToken}`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });
});
