import { createHash } from "node:crypto";

export interface RateLimitRule {
  /** Maximum number of attempts allowed inside the window. */
  max: number;
  windowSeconds: number;
}

export interface RateLimitStore {
  /** Records an attempt and reports whether it is within the limit. */
  hit(key: string, rule: RateLimitRule): Promise<boolean>;
}

/** Per-instance fallback, used in local development when no database is configured. */
export function createMemoryStore(now: () => number = Date.now): RateLimitStore {
  const windows = new Map<string, { windowStart: number; count: number }>();
  return {
    async hit(key, rule) {
      const windowMs = rule.windowSeconds * 1000;
      const windowStart = Math.floor(now() / windowMs) * windowMs;
      const current = windows.get(key);
      if (!current || current.windowStart !== windowStart) {
        windows.set(key, { windowStart, count: 1 });
        return true;
      }
      current.count += 1;
      return current.count <= rule.max;
    },
  };
}

/** Rate-limit keys never contain a raw IP address. */
export function rateLimitKey(scope: string, ip: string): string {
  return `${scope}:${createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;
}
