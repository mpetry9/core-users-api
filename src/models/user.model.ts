import { Pool, QueryResult } from "pg";
import Database from "../config/database";
import { UserWithPassword } from "../types/auth.types";
import { User, CreateUserDTO, UpdateUserDTO } from "../types/user.types";

class UserModel {
  private pool: Pool;

  private tableName = "users";

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async findAll(
    limit: number,
    offset: number,
  ): Promise<{ users: User[]; total: number }> {
    const countQuery = `SELECT COUNT(*) FROM ${this.tableName}`;
    const dataQuery = `
      SELECT id, name, email, status, created_at, updated_at 
      FROM ${this.tableName} 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;

    const [countResult, dataResult]: [QueryResult, QueryResult] =
      await Promise.all([
        this.pool.query(countQuery),
        this.pool.query(dataQuery, [limit, offset]),
      ]);

    return {
      users: dataResult.rows as User[],
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async findById(id: number): Promise<User | null> {
    const query = `
      SELECT id, name, email, status, created_at, updated_at 
      FROM ${this.tableName} 
      WHERE id = $1
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? (result.rows[0] as User) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, name, email, status, created_at, updated_at 
      FROM ${this.tableName} 
      WHERE email = $1
    `;
    const result = await this.pool.query(query, [email]);
    return result.rows.length > 0 ? (result.rows[0] as User) : null;
  }

  async create(userData: CreateUserDTO): Promise<User> {
    const query = `
      INSERT INTO ${this.tableName} (name, email, status) 
      VALUES ($1, $2, $3) 
      RETURNING id, name, email, status, created_at, updated_at
    `;
    const values = [userData.name, userData.email, userData.status || "active"];
    const result = await this.pool.query(query, values);
    return result.rows[0] as User;
  }

  async update(id: number, userData: UpdateUserDTO): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (userData.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(userData.name);
    }
    if (userData.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(userData.email);
    }
    if (userData.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(userData.status);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE ${this.tableName} 
      SET ${fields.join(", ")} 
      WHERE id = $${paramIndex} 
      RETURNING id, name, email, status, created_at, updated_at
    `;

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? (result.rows[0] as User) : null;
  }

  // ============================================
  // Authentication Methods
  // ============================================

  /**
   * Finds a user by email and includes password hash (for authentication)
   * @param email - User email
   * @returns User with password hash or null
   */
  async findByEmailWithPassword(
    email: string,
  ): Promise<UserWithPassword | null> {
    const query = `
      SELECT id, name, email, status, password_hash, created_at, updated_at 
      FROM ${this.tableName} 
      WHERE email = $1
    `;
    const result = await this.pool.query(query, [email]);
    return result.rows.length > 0 ? (result.rows[0] as UserWithPassword) : null;
  }

  /**
   * Creates a user with password hash
   * @param userData - User data including password hash
   * @returns Created user
   */
  async createWithPassword(
    userData: CreateUserDTO & { password_hash: string },
  ): Promise<User> {
    const query = `
      INSERT INTO ${this.tableName} (name, email, password_hash, status) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, email, status, created_at, updated_at
    `;
    const values = [
      userData.name,
      userData.email,
      userData.password_hash,
      userData.status || "active",
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0] as User;
  }

  /**
   * Updates a user's password
   * @param userId - User ID
   * @param passwordHash - New password hash
   * @returns Updated user or null
   */
  async updatePassword(
    userId: number,
    passwordHash: string,
  ): Promise<User | null> {
    const query = `
      UPDATE ${this.tableName} 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING id, name, email, status, created_at, updated_at
    `;
    const result = await this.pool.query(query, [passwordHash, userId]);
    return result.rows.length > 0 ? (result.rows[0] as User) : null;
  }

  /**
   * Checks if an email already exists in the database
   * @param email - Email to check
   * @returns True if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const query = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE email = $1)`;
    const result = await this.pool.query(query, [email]);
    return result.rows[0].exists;
  }

  async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export default new UserModel();
