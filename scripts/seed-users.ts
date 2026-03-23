import Database from "../src/config/database";
import { hashPassword } from "../src/utils/auth.util";

// ============================================
// User Seed Data
// ============================================
// Add your users here! Just add more objects to the array
// Password will be automatically hashed
const users = [
  {
    name: "John Doe",
    email: "john@example.com",
    password: "Password123",
    status: "active",
  },
  {
    name: "Jane Smith",
    email: "jane@example.com",
    password: "SecurePass456",
    status: "active",
  },
  {
    name: "Bob Johnson",
    email: "bob@example.com",
    password: "MyPassword789",
    status: "active",
  },
  // Add more users here as needed:
  // {
  //   name: 'Your Name',
  //   email: 'your.email@example.com',
  //   password: 'YourPassword',
  //   status: 'active',
  // },
];

// ============================================
// Seed Script
// ============================================
async function seedUsers() {
  const db = Database.getInstance();
  const pool = db.getPool();

  try {
    // eslint-disable-next-line no-console
    console.log("🌱 Starting user seeding...\n");

    for (const user of users) {
      try {
        // Check if user already exists
        const existingUser = await pool.query(
          "SELECT id, email FROM users WHERE email = $1",
          [user.email],
        );

        if (existingUser.rows.length > 0) {
          // eslint-disable-next-line no-console
          console.log(
            `⚠️  User already exists: ${user.email} (ID: ${existingUser.rows[0].id})`,
          );
          continue;
        }

        // Hash the password
        const passwordHash = await hashPassword(user.password);

        // Insert the user
        const result = await pool.query(
          `INSERT INTO users (name, email, password_hash, status) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id, name, email, status`,
          [user.name, user.email, passwordHash, user.status || "active"],
        );

        const createdUser = result.rows[0];
        // eslint-disable-next-line no-console
        console.log(
          `✅ Created user: ${createdUser.name} (${createdUser.email}) - ID: ${createdUser.id}`,
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        // eslint-disable-next-line no-console
        console.error(`❌ Failed to create user ${user.email}:`, message);
      }
    }

    // Show summary
    const countResult = await pool.query("SELECT COUNT(*) as count FROM users");
    const totalUsers = countResult.rows[0].count;

    // eslint-disable-next-line no-console
    console.log(
      `\n✨ Seeding complete! Total users in database: ${totalUsers}`,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await db.close();
    process.exit(0);
  }
}

// Run the seed script
seedUsers();
