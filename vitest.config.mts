import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    exclude: ["node_modules/**", ".next/**"],
  },
});
