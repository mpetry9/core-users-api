import { Pool, QueryResult } from "pg";
import Database from "../config/database";
import { Order, CreateOrderDTO, UpdateOrderDTO } from "../types/order.types";

class OrderModel {
  private pool: Pool;

  private tableName = "orders";

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async findAll(
    limit: number,
    offset: number,
  ): Promise<{ orders: Order[]; total: number }> {
    const countQuery = `SELECT COUNT(*) FROM ${this.tableName}`;
    const dataQuery = `
      SELECT id, user_id, total_amount, status, created_at, updated_at 
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
      orders: dataResult.rows as Order[],
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async findById(id: number): Promise<Order | null> {
    const query = `
      SELECT id, user_id, total_amount, status, created_at, updated_at 
      FROM ${this.tableName} 
      WHERE id = $1
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? (result.rows[0] as Order) : null;
  }

  async findByUserId(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<{ orders: Order[]; total: number }> {
    const countQuery = `SELECT COUNT(*) FROM ${this.tableName} WHERE user_id = $1`;
    const dataQuery = `
      SELECT id, user_id, total_amount, status, created_at, updated_at 
      FROM ${this.tableName} 
      WHERE user_id = $1
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult]: [QueryResult, QueryResult] =
      await Promise.all([
        this.pool.query(countQuery, [userId]),
        this.pool.query(dataQuery, [userId, limit, offset]),
      ]);

    return {
      orders: dataResult.rows as Order[],
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async create(orderData: CreateOrderDTO): Promise<Order> {
    const query = `
      INSERT INTO ${this.tableName} (user_id, total_amount, status) 
      VALUES ($1, $2, $3) 
      RETURNING id, user_id, total_amount, status, created_at, updated_at
    `;
    const values = [
      orderData.user_id,
      orderData.total_amount,
      orderData.status || "pending",
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0] as Order;
  }

  async update(id: number, orderData: UpdateOrderDTO): Promise<Order | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (orderData.user_id !== undefined) {
      fields.push(`user_id = $${paramIndex++}`);
      values.push(orderData.user_id);
    }
    if (orderData.total_amount !== undefined) {
      fields.push(`total_amount = $${paramIndex++}`);
      values.push(orderData.total_amount);
    }
    if (orderData.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(orderData.status);
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
      RETURNING id, user_id, total_amount, status, created_at, updated_at
    `;

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? (result.rows[0] as Order) : null;
  }

  async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export default new OrderModel();
