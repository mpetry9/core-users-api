import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface UserResult {
  name: string;
  created_at: Date;
}

async function getLastThreeUsers(): Promise<void> {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    console.error('Please set the DATABASE_URL environment variable before running this script.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 25000, // 25 second connection timeout
    statement_timeout: 25000, // 25 second query timeout
  });

  try {
    console.log('🔌 Connecting to database...');
    
    // Test connection first
    const client = await pool.connect();
    console.log('✅ Database connected successfully\n');
    client.release();

    // Query for the last 3 users
    console.log('📊 Fetching last 3 users who signed up...\n');
    
    const query = `
      SELECT name, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 3
    `;

    const startTime = Date.now();
    const result = await pool.query<UserResult>(query);
    const duration = Date.now() - startTime;

    if (result.rows.length === 0) {
      console.log('ℹ️  No users found in the database');
    } else {
      console.log(`Found ${result.rows.length} user(s):\n`);
      console.log('━'.repeat(80));
      
      result.rows.forEach((user, index) => {
        const createdAt = new Date(user.created_at);
        console.log(`${index + 1}. Name: ${user.name}`);
        console.log(`   Sign-up Date/Time: ${createdAt.toISOString()}`);
        console.log(`   (Local: ${createdAt.toLocaleString()})`);
        console.log('━'.repeat(80));
      });
    }

    console.log(`\n✨ Query completed in ${duration}ms`);

  } catch (error) {
    console.error('❌ Error occurred:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the function
getLastThreeUsers();
