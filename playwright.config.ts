import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
// Fresh embedded database per run (Windows can hold file locks on a reused directory briefly).
const E2E_DB = `.data/e2e-${Date.now()}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 240_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Deterministic, offline AI and a throwaway embedded database.
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: { AI_PROVIDER: "mock", PGLITE_DIR: E2E_DB, DATABASE_URL: "", GEMINI_API_KEY: "" },
  },
});
