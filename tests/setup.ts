import { resolve } from "path";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: resolve(__dirname, "../.env.test") });

export default async function globalSetup() {
  // eslint-disable-next-line no-console
  console.log("\n🧪 Setting up test environment...\n");
}
