import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  resolve: { alias: { "@": path.resolve("src") } },
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: [
        "src/lib/**/*.ts",
        "src/app/api/**/route.ts",
        "src/cli/flux.ts",
      ],
      exclude: ["src/lib/types.ts"],
      thresholds: { statements: 80, branches: 70, functions: 80, lines: 80 },
    },
  },
});
