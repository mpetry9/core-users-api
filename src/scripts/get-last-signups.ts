import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config();

import Database from "../config/database";

interface SignupInfo {
  name: string;
  created_at: Date;
}

/**
 * Retrieves the last N users who signed up from the database
 * @param limit Number of recent sign-ups to retrieve (default: 3)
 * @returns Array of user names and sign-up dates
 */
async function getLastSignups(limit: number = 3): Promise<SignupInfo[]> {
  const db = Database.getInstance();
  const pool = db.getPool();

  try {
    // Test database connection first
    await db.testConnection();

    // Query for last N users ordered by created_at descending
    const query = `
      SELECT name, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    return result.rows as SignupInfo[];
  } catch (error) {
    console.error("❌ Error retrieving sign-up data:", error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set.");
    console.error("\n📝 To run this script, you need to:");
    console.error("   1. Create a .env file in the project root");
    console.error("   2. Add your DATABASE_URL from Neon dashboard");
    console.error("   3. Example: DATABASE_URL=postgresql://user:pass@host/db?sslmode=require\n");
    process.exit(1);
  }

  try {
    console.log("🔍 Fetching last 3 users who signed up...\n");

    const signups = await getLastSignups(3);

    if (signups.length === 0) {
      console.log("No users found in the database.");
      return;
    }

    console.log(`✅ Found ${signups.length} recent sign-up(s):\n`);

    signups.forEach((signup, index) => {
      console.log(`${index + 1}. Name: ${signup.name}`);
      console.log(`   Signed up: ${new Date(signup.created_at).toLocaleString()}\n`);
    });

    // Close database connection
    const db = Database.getInstance();
    await db.close();
    
    console.log("✅ Operation completed successfully.");
  } catch (error) {
    console.error("❌ Failed to retrieve sign-ups:", error);
    process.exit(1);
  }
}

// Run the script
main();
