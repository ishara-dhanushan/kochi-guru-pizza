import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const src = resolve(import.meta.dirname, "src");

export default defineConfig({
  plugins: [react()],

  // Keep Vite aliases synchronized with frontend/tsconfig.json.
  resolve: {
    alias: {
      "@": src,
      "@app": resolve(src, "app"),
      "@components": resolve(src, "components"),
      "@contexts": resolve(src, "contexts"),
      "@lib": resolve(src, "lib"),
      "@services": resolve(src, "services"),
      "@typings": resolve(src, "types"),
      "@utils": resolve(src, "utils")
    }
  },

  test: {
    // Run separate test files concurrently.
    // Each worker gets its own isolated test environment.
    pool: "forks",
    fileParallelism: true,

    // Default to three workers for frontend integration tests.
    // Unit test commands override this limit to six workers.
    maxWorkers: 3,

    reporters: ["default"],

    // Browser-like environment for React component testing.
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000/"
      }
    },

    // Discover only frontend unit and integration test files.
    include: ["tests/{unit,integration}/**/*.spec.{ts,tsx}"],

    // Register jest-dom matchers and cleanup hooks.
    setupFiles: ["./tests/setup.ts"],

    // Reset and restore mocks between tests.
    clearMocks: true,
    restoreMocks: true,

    coverage: {
      provider: "v8",

      // Include untested frontend source files to expose coverage gaps.
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts"],

      // LCOV creates the HTML report under lcov-report/.
      reporter: ["text", "json-summary", "lcov"]
    }
  }
});
