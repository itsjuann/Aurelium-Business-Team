import "server-only";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  createMemoryStore,
  rateLimitKey,
  type RateLimitRule,
  type RateLimitStore,
} from "@/lib/rate-limit";

export type LeadTable = "waitlist_entries" | "contact_messages" | "booking_requests";

export type SaveResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "rate_limited" | "failed" };

const memoryStore = createMemoryStore();

function databaseStore(): RateLimitStore | null {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  return {
    async hit(key, rule) {
      const { data, error } = await supabase.rpc("check_rate_limit", {
        p_key: key,
        p_max: rule.max,
        p_window_seconds: rule.windowSeconds,
      });
      if (error) {
        console.error("[rate-limit] database check failed", error.message);
        return memoryStore.hit(key, rule);
      }
      return data === true;
    },
  };
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

const RULE: RateLimitRule = { max: 5, windowSeconds: 600 };

/**
 * Stores a public form submission. Returns `not_configured` when no database is connected:
 * the caller must tell the visitor the message was not delivered.
 */
export async function saveLead(
  table: LeadTable,
  row: Record<string, unknown>,
  options: { ignoreDuplicates?: boolean } = {},
): Promise<SaveResult> {
  const store = databaseStore() ?? memoryStore;
  if (!(await store.hit(rateLimitKey(table, await clientIp()), RULE))) {
    return { ok: false, reason: "rate_limited" };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn(`[leads] Supabase is not configured; ${table} submission was not stored.`);
    return { ok: false, reason: "not_configured" };
  }

  const { error } = await supabase.from(table).insert(row);
  if (error) {
    // 23505 = unique violation: the visitor is already on this list.
    if (options.ignoreDuplicates && error.code === "23505") return { ok: true };
    console.error(`[leads] insert into ${table} failed`, error.message);
    return { ok: false, reason: "failed" };
  }
  return { ok: true };
}
