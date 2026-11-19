import { defineConfig } from "@playwright/test";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
export default defineConfig({
  workers: 2,
  testDir: "./tests/e2e",
  use: { baseURL, headless: true },
  webServer: {
    command: `npm run dev -- --port ${new URL(baseURL).port || "3000"}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1080 } } },
    {
      name: "mobile",
      use: { viewport: { width: 390, height: 844 }, isMobile: true },
    },
  ],
});
