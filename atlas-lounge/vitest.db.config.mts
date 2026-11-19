import { defineConfig } from "vitest/config";

// Database tests need a PostgreSQL superuser connection: TEST_DATABASE_URL.
export default defineConfig({
  test: { include: ["tests/db/**/*.test.ts"], environment: "node", testTimeout: 30_000, hookTimeout: 60_000 },
});
