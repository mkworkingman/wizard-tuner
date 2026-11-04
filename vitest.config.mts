import path from "node:path";
import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        // Fast unit tests for utils, hooks and client components (jsdom).
        plugins: [react()],
        resolve: { tsconfigPaths: true },
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["**/*.test.{ts,tsx}"],
          exclude: ["node_modules/**", "e2e/**", ".next/**"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        // Every story is a test, rendered in real Chromium and checked with axe.
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") })],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
