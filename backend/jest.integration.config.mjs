/**
 * Backend integration testing configuration.
 * Three Jest workers share one dedicated MongoDB test database.
 */

import unitConfig from "./jest.config.cjs";

/** @type {import("jest").Config} */
const config = {
  ...unitConfig,

  // Run up to three integration test suites concurrently.
  maxWorkers: 3,
  testTimeout: 60000,

  // One read-only connectivity preflight before Jest starts test suites.
  globalSetup: "<rootDir>/tests/setup/integrationGlobalSetup.ts",

  testMatch: ["<rootDir>/tests/integration/**/*.integration.test.ts"],

  // Initialize the test environment before loading application modules.
  setupFiles: ["<rootDir>/tests/setup/testEnv.ts"],

  coverageDirectory: "<rootDir>/coverage/integration"
};

export default config;
