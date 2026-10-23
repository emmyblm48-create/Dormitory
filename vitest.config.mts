import path from "node:path";
import { defineConfig } from "vitest/config";

// Pin the zone so Thai date formatting and month bucketing are deterministic
process.env.TZ = "Asia/Bangkok";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
  },
});
