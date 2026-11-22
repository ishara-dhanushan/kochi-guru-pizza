// helpers/mongoPreflight.ts
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { config as loadEnv } from "dotenv";
import { MongoClient } from "mongodb";

// Keep CI-provided environment variables ahead of local .env values.
loadEnv({
  path: resolve(import.meta.dirname, "../.env")
});

const databaseName = "kochi_guru_pizza_e2e";

export default async function mongoPreflight(): Promise<void> {
  const mongoUri = process.env.MONGO_DB_URI_E2E;

  if (!mongoUri) {
    throw new Error("MONGO_DB_URI_E2E is required for Playwright tests.");
  }

  // Reject connections outside the dedicated E2E database.
  const parsedUri = new URL(mongoUri);

  if (
    !["mongodb:", "mongodb+srv:"].includes(parsedUri.protocol) ||
    parsedUri.pathname !== `/${databaseName}`
  ) {
    throw new Error(`MONGO_DB_URI_E2E must target ${databaseName}.`);
  }

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.info(
      `[E2E DB Preflight] Attempt ${attempt}/${maxAttempts}: Checking MongoDB connection...`
    );

    const client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    try {
      await client.connect();

      // Verify connectivity without modifying any database records.
      await client.db(databaseName).command({ ping: 1 });

      console.info(
        `[E2E DB Preflight] Attempt ${attempt}/${maxAttempts}: Connection successful.`
      );

      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      const transientDnsError =
        /\b(?:ENOTFOUND|EAI_AGAIN|ETIMEOUT|ESERVFAIL)\b/.test(message);

      const errorType = transientDnsError
        ? "DNS lookup failure"
        : error instanceof Error
          ? error.name
          : "Unknown error";

      console.warn(
        `[E2E DB Preflight] Attempt ${attempt}/${maxAttempts}: Failed (${errorType}).`
      );

      // Match backend integration tests: retry transient DNS errors only.
      if (!transientDnsError || attempt === maxAttempts) {
        throw new Error(
          `MongoDB E2E preflight failed after ${attempt} attempt(s). Check Atlas connectivity and credentials.`
        );
      }

      console.info(`[E2E DB Preflight] Retrying after ${attempt} second(s)...`);
    } finally {
      // Always close the temporary connection before proceeding.
      await client.close();
    }

    await delay(attempt * 1000);
  }
}
