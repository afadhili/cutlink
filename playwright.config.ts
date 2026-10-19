import { defineConfig, devices } from "@playwright/test";
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !new URL(testUrl).pathname.endsWith("_test"))
  throw new Error(
    "Set TEST_DATABASE_URL to a dedicated database ending in _test",
  );
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://localhost:5174", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "bun apps/api/src/index.ts",
      url: "http://localhost:3001/api/v1/health",
      env: {
        DATABASE_URL: testUrl,
        API_PORT: "3001",
        WEB_ORIGIN: "http://localhost:5174",
        PUBLIC_BASE_URL: "http://localhost:3001",
      },
      reuseExistingServer: false,
    },
    {
      command: "bun run --cwd apps/web dev --port 5174",
      url: "http://localhost:5174",
      env: { API_PROXY_TARGET: "http://localhost:3001" },
      reuseExistingServer: false,
    },
  ],
});
