import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 10000,
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: ["server/__tests__/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "client",
          environment: "jsdom",
          include: ["src/__tests__/**/*.test.ts", "src/__tests__/**/*.test.tsx"],
          setupFiles: ["src/__tests__/setup.ts"],
        },
      },
    ],
  },
});
