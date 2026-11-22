/**
 * Backend unit tests.
 * Jest 29 + SWC, with the same path aliases as tsconfig.json.
 */

/** @type {import("jest").Config} */
module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  maxWorkers: 6,

  transform: {
    "^.+\\.tsx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript"
          },
          target: "es2022"
        },
        module: {
          type: "commonjs"
        }
      }
    ]
  },

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^@middleware/(.*)$": "<rootDir>/src/middleware/$1",
    "^@models/(.*)$": "<rootDir>/src/models/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@schemas/(.*)$": "<rootDir>/src/schemas/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@typings/(.*)$": "<rootDir>/src/types/$1"
  },

  testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],

  // Include every production source file, even if no test imports it.
  // This makes untested modules visible as 0% coverage.
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],

  coverageProvider: "v8",
  coverageDirectory: "<rootDir>/coverage/unit",
  coverageReporters: ["text", "json-summary", "lcov"]
};
