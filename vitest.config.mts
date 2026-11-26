import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // "server-only" throws outside the React server runtime; tests run server code directly.
      "server-only": path.resolve(__dirname, "tests/support/empty.ts"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts", "tests/component/**/*.test.tsx"],
    environment: "node",
    setupFiles: ["tests/support/setup.ts"],
    env: { AI_PROVIDER: "mock", PGLITE_DIR: "memory", DATABASE_URL: "" },
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
