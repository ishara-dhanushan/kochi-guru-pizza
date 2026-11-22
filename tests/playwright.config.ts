import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

const repositoryRoot = resolve(import.meta.dirname, "..");

const frontendURL = "http://127.0.0.1:3005";
const backendURL = "http://127.0.0.1:5005";

loadEnv({
  path: resolve(import.meta.dirname, ".env")
});

const mongoUri = process.env.MONGO_DB_URI_E2E;

if (!mongoUri) {
  throw new Error("MONGO_DB_URI_E2E is required. Configure tests/.env first.");
}

// Reject database connections that do not target the dedicated E2E database.
const databaseURL = new URL(mongoUri);

if (
  !["mongodb:", "mongodb+srv:"].includes(databaseURL.protocol) ||
  databaseURL.pathname !== "/kochi_guru_pizza_e2e"
) {
  throw new Error("MONGO_DB_URI_E2E must target /kochi_guru_pizza_e2e");
}

// Run the preflight only in the main Playwright process.
// Worker processes also load this configuration, so they must skip it.
if (process.env.TEST_WORKER_INDEX === undefined) {
  execFileSync(
    process.execPath,
    ["--import=tsx", resolve(import.meta.dirname, "dbPreflight.ts")],
    {
      cwd: import.meta.dirname,
      stdio: "inherit",
      timeout: 60_000
    }
  );
}

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),

  // Keep initial E2E execution predictable.
  workers: 3,
  retries: process.env.CI ? 1 : 0,

  timeout: 60_000,

  expect: {
    timeout: 15_000
  },

  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: "playwright-report"
      }
    ]
  ],

  outputDir: "test-results",

  use: {
    baseURL: frontendURL,

    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ],

  // Start the actual backend and frontend for browser E2E tests.
  webServer: [
    {
      name: "Backend :5005",
      command: "npm exec -- tsx src/server.ts",
      cwd: resolve(repositoryRoot, "backend"),

      // Wait for both Express and MongoDB to become available.
      url: `${backendURL}/v1/menu?isAvailable=true`,
      timeout: 120_000,

      // Never connect to an unrelated server on the same port.
      reuseExistingServer: false,

      // Display Express startup messages and errors in the Playwright terminal.
      stdout: "pipe",
      stderr: "pipe",

      env: {
        NODE_ENV: "e2e",
        PORT: "5005",
        FRONTEND_URL: frontendURL,
        MONGO_DB_URI_E2E: mongoUri,

        JWT_SECRET: "kochi-playwright-access-token-secret",
        REFRESH_TOKEN_SECRET: "kochi-playwright-refresh-token-secret",

        GOOGLE_CLIENT_ID: "e2e-placeholder.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "e2e-placeholder",
        GOOGLE_CALLBACK_URL: `${backendURL}/v1/auth/google/callback`,

        CLOUDFLARE_ACCOUNT_ID: "e2e-placeholder",
        R2_ACCESS_KEY_ID: "e2e-placeholder",
        R2_SECRET_ACCESS_KEY: "e2e-placeholder",
        R2_PUBLIC_DOMAIN: "https://example.test",
        R2_BUCKET_NAME: "e2e-unused"
      }
    },

    {
      name: "Frontend :3005",
      command: "npm exec -- next dev --port 3005 --hostname 127.0.0.1",
      cwd: resolve(repositoryRoot, "frontend"),

      url: `${frontendURL}/`,
      timeout: 180_000,
      reuseExistingServer: false,

      // Display Next.js startup messages and errors in the Playwright terminal.
      stdout: "pipe",
      stderr: "pipe",

      env: {
        NODE_ENV: "development",
        E2E_TEST_MODE: "true",

        NEXT_PUBLIC_API_URL: `${backendURL}/v1`,
        INTERNAL_API_URL: `${backendURL}/v1`,

        NEXT_TELEMETRY_DISABLED: "1"
      }
    }
  ]
});
