import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSeed } from "../../scripts/generate-seed.mjs";

describe("database seed", () => {
  it("is in sync with the catalog (run `npm run db:seed:generate` if this fails)", () => {
    const onDisk = readFileSync(new URL("../../supabase/seed.sql", import.meta.url), "utf8");
    expect(onDisk).toBe(buildSeed());
  });
});
