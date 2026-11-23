// helpers/database.ts
import { setTimeout as delay } from "node:timers/promises";
import { MongoClient, type Db } from "mongodb";

const databaseName = "kochi_guru_pizza_e2e";

export async function withE2eDatabase<T>(
  operation: (database: Db) => Promise<T>
): Promise<T> {
  const uri = process.env.MONGO_DB_URI_E2E;

  if (!uri) {
    throw new Error("MONGO_DB_URI_E2E is required.");
  }

  // Never allow test fixtures to connect to the application database.
  const parsed = new URL(uri);

  if (
    !["mongodb:", "mongodb+srv:"].includes(parsed.protocol) ||
    parsed.pathname !== `/${databaseName}`
  ) {
    throw new Error("Refusing to access a non-E2E database.");
  }

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 15_000
    });
    let connected = false;

    try {
      await client.connect();
      connected = true;

      // Execute each fixture operation only once, after connecting.
      return await operation(client.db(databaseName));
    } catch (error) {
      // Never replay failed inserts, deletes, or assertions.
      if (connected) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      const transientDnsError =
        /\b(?:ENOTFOUND|EAI_AGAIN|ETIMEOUT|ESERVFAIL)\b/.test(message);

      if (!transientDnsError || attempt === maxAttempts) {
        throw error;
      }

      console.warn(
        `[E2E DB] DNS lookup failed (attempt ${attempt}/${maxAttempts}); retrying.`
      );
    } finally {
      // Close the failed or successful connection before the next attempt.
      await client.close();
    }

    await delay(attempt * 1000);
  }

  throw new Error("Unable to connect to the E2E database.");
}
