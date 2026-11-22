// tests/setup/testEnv.ts
import { config } from "dotenv";

// Load the existing backend/.env when running locally.
// Environment variables supplied by CI take precedence.
config({ path: ".env" });

// Ensure the backend selects MONGO_DB_URI_TEST.
process.env.NODE_ENV = "test";

// Fail before loading application modules if the test URI is missing.
const testDatabaseUri = process.env.MONGO_DB_URI_TEST;
if (!testDatabaseUri) {
  throw new Error(
    "MONGO_DB_URI_TEST is required when running integration tests."
  );
}

// Verify the database name before any integration test can connect.
// Production credentials must never be supplied as MONGO_DB_URI_TEST.
const parsedTestUri = new URL(testDatabaseUri);
if (
  !["mongodb:", "mongodb+srv:"].includes(parsedTestUri.protocol) ||
  parsedTestUri.pathname !== "/kochi_guru_pizza_test"
) {
  throw new Error("Integration tests must target kochi_guru_pizza_test");
}

// Prevent accidentally reusing the application's own database URI.
if (process.env.MONGO_DB_URI) {
  const applicationUri = new URL(process.env.MONGO_DB_URI);
  if (
    parsedTestUri.hostname === applicationUri.hostname &&
    parsedTestUri.pathname === applicationUri.pathname
  ) {
    throw new Error("Integration tests cannot use the application database");
  }
}
