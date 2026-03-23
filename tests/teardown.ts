import Database from "../src/config/database";
import { closeTestPool } from "./helpers/database";

export default async function globalTeardown() {
  try {
    // Close test helper pool
    await closeTestPool();

    // Close application database connection
    const db = Database.getInstance();
    await db.close();

    // eslint-disable-next-line no-console
    console.log("\n✨ Test environment cleanup complete\n");
  } catch (error) {
    console.error("Error during teardown:", error);
  }
}
