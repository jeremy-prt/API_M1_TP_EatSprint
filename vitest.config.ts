import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/services/**"],
      exclude: ["src/generated/**"],
      thresholds: {
        lines: 30,
      },
    },
  },
});
