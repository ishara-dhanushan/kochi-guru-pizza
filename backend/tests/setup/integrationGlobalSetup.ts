// tests/setup/integrationGlobalSetup.ts
import { setTimeout as delay } from "node:timers/promises";
import mongoose from "mongoose";
import "./testEnv";

// Load the existing test configuration and safety checks before connecting.
// Jest globalSetup runs before setupFiles, so the side-effect import is intentional.
const { MongoClient } = mongoose.mongo;

/**
 * Runs exactly once before Jest starts integration test suites.
 * Use a temporary native MongoDB client for a read-only connectivity check.
 * This client is NOT shared with Jest workers and is always closed.
 */
export default async function integrationGlobalSetup(): Promise<void> {
  const uri = process.env.MONGO_DB_URI_TEST;

  if (!uri) {
    throw new Error("MONGO_DB_URI_TEST is required for integration tests.");
  }

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

    try {
      await client.connect();

      // Read-only check: no schema changes, inserts or collection cleanup.
      await client.db("kochi_guru_pizza_test").command({ ping: 1 });
      console.log("MongoDB integration preflight succeeded.");
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const transientDnsError = /\b(?:ENOTFOUND|EAI_AGAIN|ETIMEOUT|ESERVFAIL)\b/.test(
        message
      );

      // Fail immediately for authentication, permission and other errors.
      if (!transientDnsError || attempt === maxAttempts) {
        throw error;
      }

      console.warn(
        `MongoDB preflight DNS lookup failed (attempt ${attempt}/${maxAttempts}); retrying.`
      );
    } finally {
      await client.close();
    }

    await delay(attempt * 1000);
  }
}
