// Generates supabase/seed.sql from src/content/catalog.json so the public site (Phase 1) and
// the database seed can never drift apart. Run: npm run db:seed:generate
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("..", import.meta.url);
const catalog = JSON.parse(readFileSync(new URL("src/content/catalog.json", root), "utf8"));

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const arr = (items) => (items.length ? `array[${items.map(q).join(", ")}]` : "'{}'::text[]");

export function buildSeed() {
  const out = [
    "-- GENERATED FILE. Do not edit by hand.",
    "-- Source: src/content/catalog.json · Regenerate: npm run db:seed:generate",
    "-- Idempotent: safe to re-run. Existing rows are left untouched so that prices and copy",
    "-- edited in the admin dashboard are never overwritten by a re-seed.",
    "",
    "insert into public.locations (slug, name, kind, status) values",
    "  ('private-mobile', 'Private Mobile Sessions', 'mobile', 'active'),",
    "  ('the-atlas-lounge', 'The Atlas Lounge', 'lounge', 'planned')",
    "on conflict (slug) do nothing;",
    "",
    "insert into public.settings (key, value, description) values",
    "  ('booking.cancellation_window_hours', 'null', 'Hours before start when free cancellation ends. Set before launch.'),",
    "  ('booking.hold_minutes', '15', 'Minutes an unpaid appointment hold is kept.'),",
    "  ('booking.min_lead_hours', 'null', 'Minimum notice required for a new booking. Set before launch.'),",
    "  ('ai.faq_assistant_enabled', 'false', 'Administrator switch for the website FAQ assistant.'),",
    "  ('ai.booking_assistance_enabled', 'false', 'Administrator switch for booking assistance.'),",
    "  ('ai.service_recommendations_enabled', 'false', 'Administrator switch for general service recommendations.'),",
    "  ('ai.follow_up_drafts_enabled', 'false', 'Administrator switch for follow-up message drafts.'),",
    "  ('ai.analytics_summaries_enabled', 'false', 'Administrator switch for business analytics summaries.')",
    "on conflict (key) do nothing;",
    "",
  ];

  catalog.services.forEach((s, i) => {
    out.push(
      "insert into public.services (slug, name, category, summary, description, includes, designed_for,",
      "  what_to_expect, precautions, status, required_credential_type, buffer_before_min, buffer_after_min, sort_order)",
      `values (${q(s.slug)}, ${q(s.name)}, ${q(s.category)}, ${q(s.summary)},`,
      `  ${q(s.description)},`,
      `  ${arr(s.includes)},`,
      `  ${arr(s.designedFor)},`,
      `  ${arr(s.whatToExpect)},`,
      `  ${arr(s.precautions)},`,
      `  ${q(s.status)}, ${q(s.requiredCredentialType)}, ${s.bufferBeforeMin}, ${s.bufferAfterMin}, ${(i + 1) * 10})`,
      "on conflict (slug) do nothing;",
      "",
    );
    for (const v of s.variants) {
      out.push(
        "insert into public.service_variants (service_id, duration_min, price_cents, status)",
        `select id, ${v.durationMin}, ${v.priceCents}, ${q(v.status)} from public.services where slug = ${q(s.slug)}`,
        "on conflict (service_id, duration_min) do nothing;",
      );
    }
    out.push("");
  });

  catalog.packages.forEach((p, i) => {
    out.push(
      "insert into public.packages (slug, name, summary, service_variant_id, session_count, price_cents, status, sort_order)",
      `select ${q(p.slug)}, ${q(p.name)}, ${q(p.summary)}, v.id, ${p.sessionCount}, ${p.priceCents}, ${q(p.status)}, ${(i + 1) * 10}`,
      "from public.service_variants v join public.services s on s.id = v.service_id",
      `where s.slug = ${q(p.serviceSlug)} and v.duration_min = ${p.durationMin}`,
      "on conflict (slug) do nothing;",
      "",
    );
  });

  return out.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("supabase/seed.sql", root), buildSeed());
  console.log("Wrote supabase/seed.sql");
}
