import { describe, expect, it } from "vitest";
import { createMemoryStore, rateLimitKey } from "@/lib/rate-limit";

describe("rate limiting", () => {
  it("allows up to the limit, blocks beyond it, and resets in the next window", async () => {
    let now = 1_000_000;
    const store = createMemoryStore(() => now);
    const rule = { max: 2, windowSeconds: 60 };
    expect(await store.hit("k", rule)).toBe(true);
    expect(await store.hit("k", rule)).toBe(true);
    expect(await store.hit("k", rule)).toBe(false);
    expect(await store.hit("other", rule)).toBe(true);
    now += 61_000;
    expect(await store.hit("k", rule)).toBe(true);
  });

  it("never puts a raw IP address in a key", () => {
    const key = rateLimitKey("contact_messages", "203.0.113.7");
    expect(key).not.toContain("203.0.113.7");
    expect(key).toBe(rateLimitKey("contact_messages", "203.0.113.7"));
    expect(key).not.toBe(rateLimitKey("contact_messages", "203.0.113.8"));
  });
});
