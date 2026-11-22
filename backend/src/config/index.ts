// src/config/index.ts
import dotenv from "dotenv";
dotenv.config();

const {
  PORT,
  MONGO_DB_URI,
  MONGO_DB_URI_TEST,
  MONGO_DB_URI_E2E,
  FRONTEND_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  NODE_ENV,
  CLOUDFLARE_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_PUBLIC_DOMAIN,
  R2_BUCKET_NAME
} = process.env;

// Automated tests must use dedicated databases, never the application database.
const isTestEnvironment = NODE_ENV === "test";
const isE2eEnvironment = NODE_ENV === "e2e";

const activeMongoDbUri = isE2eEnvironment
  ? MONGO_DB_URI_E2E
  : isTestEnvironment
    ? MONGO_DB_URI_TEST
    : MONGO_DB_URI;

const requiredMongoDbVariable = isE2eEnvironment
  ? "MONGO_DB_URI_E2E"
  : isTestEnvironment
    ? "MONGO_DB_URI_TEST"
    : "MONGO_DB_URI";

// Validate required environment variables
const requiredEnvVars = [
  requiredMongoDbVariable,
  "FRONTEND_URL",
  "JWT_SECRET",
  "REFRESH_TOKEN_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
  "CLOUDFLARE_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_DOMAIN",
  "R2_BUCKET_NAME"
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

// Prevent integration tests from accessing an unintended database.
// The test connection must always target the dedicated test database.
if (isTestEnvironment && activeMongoDbUri) {
  const testUri = new URL(activeMongoDbUri);

  if (
    !["mongodb:", "mongodb+srv:"].includes(testUri.protocol) ||
    testUri.pathname !== "/kochi_guru_pizza_test"
  ) {
    throw new Error(
      "MONGO_DB_URI_TEST must target the kochi_guru_pizza_test database"
    );
  }

  // Prevent connecting to the application database using
  // different credentials for the same database.
  if (MONGO_DB_URI) {
    const applicationUri = new URL(MONGO_DB_URI);

    if (
      applicationUri.hostname === testUri.hostname &&
      applicationUri.pathname === testUri.pathname
    ) {
      throw new Error("Integration tests cannot use the application database");
    }
  }
}

// Restrict browser tests to the dedicated E2E database.
if (isE2eEnvironment && activeMongoDbUri) {
  const e2eUri = new URL(activeMongoDbUri);

  if (
    !["mongodb:", "mongodb+srv:"].includes(e2eUri.protocol) ||
    e2eUri.pathname !== "/kochi_guru_pizza_e2e"
  ) {
    throw new Error(
      "MONGO_DB_URI_E2E must target the kochi_guru_pizza_e2e database"
    );
  }

  // Prevent accidentally reusing the application or Jest database.
  for (const otherUri of [MONGO_DB_URI, MONGO_DB_URI_TEST]) {
    if (!otherUri) {
      continue;
    }

    const parsed = new URL(otherUri);

    if (
      parsed.hostname === e2eUri.hostname &&
      parsed.pathname === e2eUri.pathname
    ) {
      throw new Error(
        "E2E tests cannot share the application or Jest test database"
      );
    }
  }
}

interface Config {
  PORT: number;
  MONGO_DB_URI: string;
  FRONTEND_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  MAX_ACTIVE_SESSIONS: number;
  NODE_ENV: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_PUBLIC_DOMAIN: string;
  R2_BUCKET_NAME: string;
}

const config: Config = {
  PORT: PORT ? Number(PORT) : 5000,
  MONGO_DB_URI: activeMongoDbUri as string,
  FRONTEND_URL: FRONTEND_URL as string,
  JWT_SECRET: JWT_SECRET as string,
  JWT_EXPIRES_IN: JWT_EXPIRES_IN || "1d",
  REFRESH_TOKEN_SECRET: REFRESH_TOKEN_SECRET as string,
  REFRESH_TOKEN_EXPIRES_IN: REFRESH_TOKEN_EXPIRES_IN || "30d",
  GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: GOOGLE_CLIENT_SECRET as string,
  GOOGLE_CALLBACK_URL: GOOGLE_CALLBACK_URL as string,
  MAX_ACTIVE_SESSIONS: Number(process.env.MAX_ACTIVE_SESSIONS) || 5,
  NODE_ENV: NODE_ENV || "production",
  CLOUDFLARE_ACCOUNT_ID: CLOUDFLARE_ACCOUNT_ID as string,
  R2_ACCESS_KEY_ID: R2_ACCESS_KEY_ID as string,
  R2_SECRET_ACCESS_KEY: R2_SECRET_ACCESS_KEY as string,
  R2_PUBLIC_DOMAIN: R2_PUBLIC_DOMAIN as string,
  R2_BUCKET_NAME: R2_BUCKET_NAME as string
};

export default config;
