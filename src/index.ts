import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config();

import app from "./app";
import Database from "./config/database";

const PORT = process.env.PORT ?? 3000;

const startServer = async (): Promise<void> => {
  try {
    // Initialize database connection
    const db = Database.getInstance();
    await db.testConnection();

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  const db = Database.getInstance();
  await db.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  const db = Database.getInstance();
  await db.close();
  process.exit(0);
});

startServer();
