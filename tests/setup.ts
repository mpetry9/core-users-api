import dotenv from "dotenv";
import { resolve } from "path";

// Load test environment variables
dotenv.config({ path: resolve(__dirname, "../.env.test") });

export default async function globalSetup() {
  console.log("\n🧪 Setting up test environment...\n");
}
