import request from "supertest";
import app from "../../src/app";
import Database from "../../src/config/database";
import {
  cleanDatabase,
  getTestPool,
  closeTestPool,
  query,
} from "../helpers/database";

// Import the app

describe("Auth Routes (E2E)", () => {
  beforeAll(async () => {
    // Ensure test database connection works
    const pool = getTestPool();
    await pool.query("SELECT 1");
  });

  beforeEach(async () => {
    // Clean database before each test
    await cleanDatabase();
  });

  afterAll(async () => {
    // Close database connections
    await closeTestPool();

    // Close app's database connection
    try {
      const db = Database.getInstance();
      await db.close();
    } catch (error) {
      // Ignore errors if already closed
    }
  });

  describe("POST /auth/signup", () => {
    it("should create new user with valid data", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "Password123",
        })
        .expect(201);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body.user).toMatchObject({
        name: "John Doe",
        email: "john@example.com",
        status: "active",
      });
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).not.toHaveProperty("password");
      expect(response.body.user).not.toHaveProperty("password_hash");
    });

    it("should reject duplicate email", async () => {
      // Create first user
      await request(app).post("/auth/signup").send({
        name: "First User",
        email: "duplicate@example.com",
        password: "Password123",
      });

      // Try to create second user with same email
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "Second User",
          email: "duplicate@example.com",
          password: "DifferentPass123",
        })
        .expect(409);

      expect(response.body).toMatchObject({
        error: "Conflict",
        message: expect.stringContaining("already exists"),
      });
    });

    it("should reject invalid email format", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "John Doe",
          email: "not-an-email",
          password: "Password123",
        })
        .expect(400);

      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toEqual(
        expect.arrayContaining([expect.stringContaining("valid email")]),
      );
    });

    it("should reject weak password", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "weak",
        })
        .expect(400);

      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.stringContaining("at least 8 characters"),
        ]),
      );
    });

    it("should reject password without letter", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "12345678",
        })
        .expect(400);

      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.stringContaining("one letter and one number"),
        ]),
      );
    });

    it("should reject password without number", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "PasswordOnly",
        })
        .expect(400);

      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.stringContaining("one letter and one number"),
        ]),
      );
    });

    it("should reject name shorter than 2 characters", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "J",
          email: "john@example.com",
          password: "Password123",
        })
        .expect(400);

      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.stringContaining("at least 2 characters"),
        ]),
      );
    });

    it("should reject missing required fields", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({})
        .expect(400);

      expect(response.body.details.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app).post("/auth/signup").send({
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      });
    });

    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "Password123",
        })
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body.user).toMatchObject({
        email: "test@example.com",
        status: "active",
      });
    });

    it("should reject invalid email", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "wrong@example.com",
          password: "Password123",
        })
        .expect(401);

      expect(response.body).toMatchObject({
        error: "Unauthorized",
        message: "Invalid email or password",
      });
    });

    it("should reject invalid password", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "WrongPassword123",
        })
        .expect(401);

      expect(response.body.message).toBe("Invalid email or password");
    });

    it("should reject inactive user", async () => {
      // Update user status to inactive
      await query("UPDATE users SET status = $1 WHERE email = $2", [
        "inactive",
        "test@example.com",
      ]);

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "Password123",
        })
        .expect(401);

      expect(response.body.message).toContain("not active");
    });

    it("should reject user without password hash", async () => {
      // Create user without password (edge case)
      await query(
        "INSERT INTO users (name, email, status) VALUES ($1, $2, $3)",
        ["No Password User", "nopassword@example.com", "active"],
      );

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "nopassword@example.com",
          password: "AnyPassword123",
        })
        .expect(401);

      expect(response.body.message).toBe(
        "No password set for this account. Please use password reset.",
      );
    });

    it("should reject malformed email", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "not-an-email",
          password: "Password123",
        })
        .expect(400);

      expect(response.body.error).toBe("Validation failed");
    });

    it("should reject missing password", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
        })
        .expect(400);

      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Password is required"),
        ]),
      );
    });
  });

  describe("POST /auth/refresh", () => {
    let validRefreshToken: string;
    let validAccessToken: string;

    beforeEach(async () => {
      // Create user and get tokens
      const response = await request(app).post("/auth/signup").send({
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      });

      validRefreshToken = response.body.refreshToken;
      validAccessToken = response.body.accessToken;
    });

    it("should return new tokens with valid refresh token", async () => {
      const response = await request(app)
        .post("/auth/refresh")
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");

      // Verify tokens are valid (they might be identical if generated in same second)
      expect(typeof response.body.accessToken).toBe("string");
      expect(typeof response.body.refreshToken).toBe("string");
      expect(response.body.accessToken.length).toBeGreaterThan(0);
      expect(response.body.refreshToken.length).toBeGreaterThan(0);
    });

    it("should reject access token (wrong type)", async () => {
      const response = await request(app)
        .post("/auth/refresh")
        .send({
          refreshToken: validAccessToken, // Using access token instead
        })
        .expect(401);

      expect(response.body.message).toContain("refresh token");
    });

    it("should reject invalid refresh token", async () => {
      const response = await request(app)
        .post("/auth/refresh")
        .send({
          refreshToken: "invalid.token.here",
        })
        .expect(401);

      expect(response.body.error).toBe("Unauthorized");
    });

    it("should reject missing refresh token", async () => {
      const response = await request(app)
        .post("/auth/refresh")
        .send({})
        .expect(400);

      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Refresh token is required"),
        ]),
      );
    });

    it("should reject refresh token for deleted user", async () => {
      // Delete the user
      await query("DELETE FROM users WHERE email = $1", ["test@example.com"]);

      const response = await request(app)
        .post("/auth/refresh")
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(401);

      expect(response.body.message).toContain("User not found");
    });
  });

  describe("GET /auth/me", () => {
    let accessToken: string;
    let user: { id: number; name: string; email: string; status: string };

    beforeEach(async () => {
      const response = await request(app).post("/auth/signup").send({
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      });

      accessToken = response.body.accessToken;
      user = response.body.user;
    });

    it("should return current user with valid JWT", async () => {
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: user.id,
        name: "Test User",
        email: "test@example.com",
        status: "active",
      });
      expect(response.body).not.toHaveProperty("password");
      expect(response.body).not.toHaveProperty("password_hash");
    });

    it("should reject request without authorization header", async () => {
      const response = await request(app).get("/auth/me").expect(401);

      expect(response.body).toMatchObject({
        error: "Unauthorized",
        message: "Authorization header is required",
      });
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer invalid.token")
        .expect(401);

      expect(response.body.error).toBe("Unauthorized");
    });

    it("should reject request with malformed header", async () => {
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", "InvalidFormat")
        .expect(401);

      expect(response.body.message).toContain(
        "Invalid authorization header format",
      );
    });

    it("should return updated user data", async () => {
      // Update user name in database
      await query("UPDATE users SET name = $1 WHERE id = $2", [
        "Updated Name",
        user.id,
      ]);

      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.name).toBe("Updated Name");
    });

    it("should reject if user becomes inactive after token issuance", async () => {
      // Deactivate user
      await query("UPDATE users SET status = $1 WHERE id = $2", [
        "suspended",
        user.id,
      ]);

      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body.message).toContain("not active");
    });
  });
});
