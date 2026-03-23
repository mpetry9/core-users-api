import { Pool, PoolConfig } from "pg";

class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    const config: PoolConfig = {
      connectionString: process.env.DATABASE_URL,
      // Disable SSL for local/test environments, enable for production
      ssl:
        process.env.NODE_ENV === "production"
          ? {
              rejectUnauthorized: false,
            }
          : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    this.pool = new Pool(config);

    this.pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
      process.exit(-1);
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log("✅ Database connected successfully");
      client.release();
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      // @ts-ignore - Reset the instance for testing
      Database.instance = null as any;
      console.log("Database connection closed");
    }
  }
}

export default Database;
