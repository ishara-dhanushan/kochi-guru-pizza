// helpers/database.ts
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

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15_000
  });

  try {
    await client.connect();

    return await operation(client.db(databaseName));
  } finally {
    // Release the connection even when fixture setup or cleanup fails.
    await client.close();
  }
}
