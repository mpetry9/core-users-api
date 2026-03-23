import { Pool } from "pg";

let testPool: Pool | null = null;

/**
 * Get or create a database pool for testing
 */
export function getTestPool(): Pool {
  if (!testPool) {
    testPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Disable SSL for local testing
      ssl: false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return testPool;
}

/**
 * Clean all data from test database tables
 */
export async function cleanDatabase(): Promise<void> {
  const pool = getTestPool();

  try {
    await pool.query("DELETE FROM api_keys");
    await pool.query("DELETE FROM users");

    // Reset sequences
    await pool.query("ALTER SEQUENCE users_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE api_keys_id_seq RESTART WITH 1");
  } catch (error) {
    console.error("Error cleaning database:", error);
    throw error;
  }
}

/**
 * Close the test database pool
 */
export async function closeTestPool(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

/**
 * Verify test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const pool = getTestPool();
    const result = await pool.query("SELECT NOW()");
    return !!result;
  } catch (error) {
    console.error("Test database connection failed:", error);
    return false;
  }
}

/**
 * Execute a raw SQL query (useful for setup/teardown)
 */
export async function query(sql: string, params?: any[]): Promise<any> {
  const pool = getTestPool();
  return pool.query(sql, params);
}
