import { defineConfig } from "@playwright/test";

// End-to-end smoke tests against the BUILT extension in dist/.
// `npm run e2e` builds first; see e2e/extension.ts for how the extension is
// loaded (persistent Chromium context, new headless mode).
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  // Each test launches its own browser profile, so tests are isolated, but
  // several Chromium instances decoding video at once is a waste on CI.
  fullyParallel: false,
  workers: process.env.CI ? 1 : 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
