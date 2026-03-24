import Database from "../../../src/config/database";
import UserModel from "../../../src/models/user.model";
import { CreateUserDTO, UpdateUserDTO } from "../../../src/types/user.types";
import { hashPassword } from "../../helpers/auth";
import {
  cleanDatabase,
  closeTestPool,
  getTestPool,
  query,
} from "../../helpers/database";

describe("UserModel", () => {
  beforeAll(async () => {
    const pool = getTestPool();
    await pool.query("SELECT 1");
  });

  beforeEach(async () => {
    await cleanDatabase();
  });
  afterAll(async () => {
    await closeTestPool();
    const db = Database.getInstance();
    await db.close();
  });

  describe("findAll", () => {
    it("should return all users with pagination", async () => {
      // Create test users
      const password = await hashPassword("Password123");
      await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
        ["User 1", "user1@example.com", password, "active"],
      );
      await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
        ["User 2", "user2@example.com", password, "active"],
      );

      const result = await UserModel.findAll(10, 0);

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.users[0]).not.toHaveProperty("password_hash");
    });

    it("should return empty array when no users exist", async () => {
      const result = await UserModel.findAll(10, 0);

      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should respect limit parameter", async () => {
      const password = await hashPassword("Password123");
      for (let i = 1; i <= 5; i++) {
        await query(
          "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
          [`User ${i}`, `user${i}@example.com`, password, "active"],
        );
      }

      const result = await UserModel.findAll(3, 0);

      expect(result.users).toHaveLength(3);
      expect(result.total).toBe(5);
    });

    it("should respect offset parameter", async () => {
      const password = await hashPassword("Password123");
      for (let i = 1; i <= 5; i++) {
        await query(
          "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
          [`User ${i}`, `user${i}@example.com`, password, "active"],
        );
      }

      const result = await UserModel.findAll(10, 3);

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(5);
    });

    it("should return users ordered by created_at DESC", async () => {
      const password = await hashPassword("Password123");
      await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
        ["Old User", "old@example.com", password, "active"],
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
      await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
        ["New User", "new@example.com", password, "active"],
      );

      const result = await UserModel.findAll(10, 0);

      expect(result.users[0].email).toBe("new@example.com");
      expect(result.users[1].email).toBe("old@example.com");
    });
  });

  describe("findById", () => {
    it("should find a user by ID", async () => {
      const password = await hashPassword("Password123");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created: any = await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Test User", "test@example.com", password, "active"],
      );
      const userId = created.rows[0].id;

      const user = await UserModel.findById(userId);

      expect(user).not.toBeNull();
      expect(user!.id).toBe(userId);
      expect(user!.email).toBe("test@example.com");
      expect(user).not.toHaveProperty("password_hash");
    });

    it("should return null for non-existent user", async () => {
      const user = await UserModel.findById(99999);

      expect(user).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should find a user by email", async () => {
      const password = await hashPassword("Password123");
      await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
        ["Test User", "test@example.com", password, "active"],
      );

      const user = await UserModel.findByEmail("test@example.com");

      expect(user).not.toBeNull();
      expect(user!.email).toBe("test@example.com");
      expect(user).not.toHaveProperty("password_hash");
    });

    it("should return null for non-existent email", async () => {
      const user = await UserModel.findByEmail("nonexistent@example.com");

      expect(user).toBeNull();
    });

    it("should be case-sensitive", async () => {
      const password = await hashPassword("Password123");
      await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
        ["Test User", "test@example.com", password, "active"],
      );

      const user = await UserModel.findByEmail("TEST@EXAMPLE.COM");

      // Email matching should be case-sensitive as per typical SQL behavior
      expect(user).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const userData: CreateUserDTO = {
        name: "New User",
        email: "new@example.com",
        status: "active",
      };

      const user = await UserModel.create(userData);

      expect(user).toHaveProperty("id");
      expect(user.name).toBe("New User");
      expect(user.email).toBe("new@example.com");
      expect(user.status).toBe("active");
      expect(user).not.toHaveProperty("password_hash");
    });

    it("should create user with default active status", async () => {
      const userData: CreateUserDTO = {
        name: "New User",
        email: "new@example.com",
      };

      const user = await UserModel.create(userData);

      expect(user.status).toBe("active");
    });
  });

  describe("update", () => {
    let testUserId: number;

    beforeEach(async () => {
      const password = await hashPassword("Password123");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created: any = await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Test User", "test@example.com", password, "active"],
      );
      testUserId = created.rows[0].id;
    });

    it("should update user name", async () => {
      const updateData: UpdateUserDTO = {
        name: "Updated Name",
      };

      const user = await UserModel.update(testUserId, updateData);

      expect(user).not.toBeNull();
      expect(user!.name).toBe("Updated Name");
      expect(user!.email).toBe("test@example.com"); // Unchanged
    });

    it("should update user email", async () => {
      const updateData: UpdateUserDTO = {
        email: "newemail@example.com",
      };

      const user = await UserModel.update(testUserId, updateData);

      expect(user).not.toBeNull();
      expect(user!.email).toBe("newemail@example.com");
      expect(user!.name).toBe("Test User"); // Unchanged
    });

    it("should update user status", async () => {
      const updateData: UpdateUserDTO = {
        status: "inactive",
      };

      const user = await UserModel.update(testUserId, updateData);

      expect(user).not.toBeNull();
      expect(user!.status).toBe("inactive");
    });

    it("should update multiple fields at once", async () => {
      const updateData: UpdateUserDTO = {
        name: "New Name",
        email: "new@example.com",
        status: "inactive",
      };

      const user = await UserModel.update(testUserId, updateData);

      expect(user).not.toBeNull();
      expect(user!.name).toBe("New Name");
      expect(user!.email).toBe("new@example.com");
      expect(user!.status).toBe("inactive");
    });

    it("should return existing user when no fields to update", async () => {
      const updateData: UpdateUserDTO = {};

      const user = await UserModel.update(testUserId, updateData);

      expect(user).not.toBeNull();
      expect(user!.name).toBe("Test User");
    });

    it("should return null for non-existent user", async () => {
      const updateData: UpdateUserDTO = {
        name: "Updated Name",
      };

      const user = await UserModel.update(99999, updateData);

      expect(user).toBeNull();
    });

    it("should update the updated_at timestamp", async () => {
      const beforeUpdate = await UserModel.findById(testUserId);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updateData: UpdateUserDTO = {
        name: "Updated Name",
      };

      const afterUpdate = await UserModel.update(testUserId, updateData);

      expect(afterUpdate!.updated_at).not.toEqual(beforeUpdate!.updated_at);
    });
  });

  describe("findByEmailWithPassword", () => {
    it("should find a user by email with password hash", async () => {
      const password = await hashPassword("Password123");
      await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
        ["Test User", "test@example.com", password, "active"],
      );

      const user = await UserModel.findByEmailWithPassword("test@example.com");

      expect(user).not.toBeNull();
      expect(user!.email).toBe("test@example.com");
      expect(user).toHaveProperty("password_hash");
      expect(user!.password_hash).toBe(password);
    });

    it("should return null for non-existent email", async () => {
      const user = await UserModel.findByEmailWithPassword(
        "nonexistent@example.com",
      );

      expect(user).toBeNull();
    });
  });

  describe("createWithPassword", () => {
    it("should create a user with password hash", async () => {
      const passwordHash = await hashPassword("Password123");
      const userData = {
        name: "New User",
        email: "new@example.com",
        password_hash: passwordHash,
        status: "active",
      };

      const user = await UserModel.createWithPassword(userData);

      expect(user).toHaveProperty("id");
      expect(user.name).toBe("New User");
      expect(user.email).toBe("new@example.com");
      expect(user).not.toHaveProperty("password_hash"); // Should not be in response

      // Verify password was stored
      const userWithPassword =
        await UserModel.findByEmailWithPassword("new@example.com");
      expect(userWithPassword!.password_hash).toBe(passwordHash);
    });

    it("should create user with default active status", async () => {
      const passwordHash = await hashPassword("Password123");
      const userData = {
        name: "New User",
        email: "new@example.com",
        password_hash: passwordHash,
      };

      const user = await UserModel.createWithPassword(userData);

      expect(user.status).toBe("active");
    });
  });

  describe("updatePassword", () => {
    let testUserId: number;

    beforeEach(async () => {
      const password = await hashPassword("Password123");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created: any = await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Test User", "test@example.com", password, "active"],
      );
      testUserId = created.rows[0].id;
    });

    it("should update user password", async () => {
      const newPasswordHash = await hashPassword("NewPassword123");

      const user = await UserModel.updatePassword(testUserId, newPasswordHash);

      expect(user).not.toBeNull();
      expect(user!.id).toBe(testUserId);

      // Verify password was updated
      const userWithPassword =
        await UserModel.findByEmailWithPassword("test@example.com");
      expect(userWithPassword!.password_hash).toBe(newPasswordHash);
    });

    it("should return null for non-existent user", async () => {
      const newPasswordHash = await hashPassword("NewPassword123");

      const user = await UserModel.updatePassword(99999, newPasswordHash);

      expect(user).toBeNull();
    });

    it("should update the updated_at timestamp", async () => {
      const beforeUpdate = await UserModel.findById(testUserId);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const newPasswordHash = await hashPassword("NewPassword123");
      const afterUpdate = await UserModel.updatePassword(
        testUserId,
        newPasswordHash,
      );

      expect(afterUpdate!.updated_at).not.toEqual(beforeUpdate!.updated_at);
    });
  });

  describe("emailExists", () => {
    it("should return true when email exists", async () => {
      const password = await hashPassword("Password123");
      await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4)",
        ["Test User", "test@example.com", password, "active"],
      );

      const exists = await UserModel.emailExists("test@example.com");

      expect(exists).toBe(true);
    });

    it("should return false when email does not exist", async () => {
      const exists = await UserModel.emailExists("nonexistent@example.com");

      expect(exists).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete a user", async () => {
      const password = await hashPassword("Password123");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created: any = await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Test User", "test@example.com", password, "active"],
      );
      const userId = created.rows[0].id;

      const success = await UserModel.delete(userId);

      expect(success).toBe(true);

      const user = await UserModel.findById(userId);
      expect(user).toBeNull();
    });

    it("should return false when deleting non-existent user", async () => {
      const success = await UserModel.delete(99999);

      expect(success).toBe(false);
    });

    it("should cascade delete related records", async () => {
      const password = await hashPassword("Password123");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created: any = await query(
        "INSERT INTO users (name, email, password_hash, status) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Test User", "test@example.com", password, "active"],
      );
      const userId = created.rows[0].id;

      // Create an API key for the user
      await query(
        "INSERT INTO api_keys (user_id, key_hash, name) VALUES ($1, $2, $3)",
        [userId, "somehash", "Test Key"],
      );

      const success = await UserModel.delete(userId);

      expect(success).toBe(true);

      // Verify API key was also deleted (due to CASCADE)
      const apiKeys = await query("SELECT * FROM api_keys WHERE user_id = $1", [
        userId,
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((apiKeys as any).rows).toHaveLength(0);
    });
  });
});
