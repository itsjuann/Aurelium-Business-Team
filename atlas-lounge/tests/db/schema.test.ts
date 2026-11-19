// Applies the real migrations and seed to a throwaway PostgreSQL database and exercises the
// safeguards that must hold at the database level. Requires TEST_DATABASE_URL (superuser).
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const adminUrl = process.env.TEST_DATABASE_URL;
const supabaseDir = fileURLToPath(new URL("../../supabase/", import.meta.url));
const dbName = `atlas_test_${process.pid}_${Date.now()}`;

let admin: Client;
let db: Client;
const ids = {} as Record<
  "owner" | "clientA" | "clientB" | "pracUser" | "practitioner" | "other" | "massage" | "v60" | "v90",
  string
>;

const connect = async () => {
  const url = new URL(adminUrl!);
  url.pathname = `/${dbName}`;
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  return client;
};

/** Runs statements as an API role (anon / authenticated user), then rolls back. */
async function as<T>(role: "anon" | "authenticated", userId: string | null, fn: (c: Client) => Promise<T>): Promise<T> {
  await db.query("begin");
  try {
    await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId ?? ""]);
    await db.query(`set local role ${role}`);
    return await fn(db);
  } finally {
    await db.query("rollback");
  }
}

const sqlState = async (p: Promise<unknown>) => p.then(() => null, (e: { code?: string }) => e.code ?? "unknown");

function appointment(start: string, overrides: Record<string, unknown> = {}) {
  const row = {
    client_id: ids.clientA,
    practitioner_id: ids.practitioner,
    service_variant_id: ids.v60,
    starts_at: start,
    duration_min: 60,
    buffer_after_min: 15,
    price_cents: 12000,
    total_cents: 12000,
    status: "confirmed",
    ...overrides,
  };
  const keys = Object.keys(row);
  return {
    text: `insert into appointments (${keys.join(", ")}) values (${keys.map((_, i) => `$${i + 1}`).join(", ")}) returning id`,
    values: Object.values(row),
  };
}

describe.skipIf(!adminUrl)("database safeguards", () => {
  beforeAll(async () => {
    admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`create database ${dbName}`);
    await admin.query(`alter database ${dbName} set search_path = public, extensions`);
    db = await connect();

    await db.query(readFileSync(`${supabaseDir}tests/local_shim.sql`, "utf8"));
    for (const file of readdirSync(`${supabaseDir}migrations`).sort()) {
      await db.query(readFileSync(`${supabaseDir}migrations/${file}`, "utf8"));
    }
    const seed = readFileSync(`${supabaseDir}seed.sql`, "utf8");
    await db.query(seed);
    await db.query(seed); // idempotent

    const user = async (email: string) =>
      (await db.query(`insert into auth.users (email) values ($1) returning id`, [email])).rows[0].id as string;
    ids.owner = await user("owner@example.test");
    ids.clientA = await user("a@example.test");
    ids.clientB = await user("b@example.test");
    ids.pracUser = await user("prac@example.test");
    await db.query(`update profiles set role = 'owner' where id = $1`, [ids.owner]);
    await db.query(`update profiles set role = 'practitioner' where id = $1`, [ids.pracUser]);

    ids.massage = (await db.query(`select id from services where slug = 'massage'`)).rows[0].id;
    const variants = await db.query(
      `select id, duration_min from service_variants where service_id = $1 order by duration_min`,
      [ids.massage],
    );
    ids.v60 = variants.rows[0].id;
    ids.v90 = variants.rows[1].id;
    const prac = async (name: string, profile: string | null) =>
      (
        await db.query(
          `insert into practitioners (display_name, profile_id, is_active) values ($1, $2, true) returning id`,
          [name, profile],
        )
      ).rows[0].id as string;
    ids.practitioner = await prac("Verified Practitioner", ids.pracUser);
    ids.other = await prac("Unverified Practitioner", null);
  });

  afterAll(async () => {
    await db?.end();
    await admin?.query(`drop database if exists ${dbName} with (force)`);
    await admin?.end();
  });

  describe("catalog and drafts", () => {
    it("seeds massage as published and every proposed service and package as draft", async () => {
      const services = await db.query(`select slug, status from services order by sort_order`);
      expect(services.rows).toEqual([
        { slug: "massage", status: "published" },
        { slug: "myofascial-release", status: "draft" },
        { slug: "stretch-and-mobility", status: "draft" },
        { slug: "muscle-activation", status: "draft" },
        { slug: "massage-and-muscle-activation", status: "draft" },
      ]);
      const packages = await db.query(`select count(*)::int n, count(*) filter (where status = 'draft')::int d from packages`);
      expect(packages.rows[0]).toEqual({ n: 4, d: 4 });
    });

    it("hides drafts from anonymous visitors", async () => {
      const seen = await as("anon", null, async (c) => ({
        services: (await c.query(`select slug from services`)).rows.map((r) => r.slug),
        variants: (await c.query(`select count(*)::int n from service_variants`)).rows[0].n,
        packages: (await c.query(`select count(*)::int n from packages`)).rows[0].n,
        planned: (await c.query(`select count(*)::int n from locations where status = 'planned'`)).rows[0].n,
      }));
      expect(seen).toEqual({ services: ["massage"], variants: 3, packages: 0, planned: 0 });
    });

    it("does not let visitors or clients edit prices", async () => {
      const changed = await as("authenticated", ids.clientA, async (c) =>
        (await c.query(`update service_variants set price_cents = 1 returning id`)).rowCount,
      );
      expect(changed).toBe(0);
    });
  });

  describe("practitioner eligibility", () => {
    const bookable = async () =>
      (await db.query(`select is_bookable from catalog_services where slug = 'massage'`)).rows[0].is_bookable;

    it("keeps a licence-gated service unbookable until a credential is verified", async () => {
      expect(await bookable()).toBe(false);

      await db.query(`insert into practitioner_services (practitioner_id, service_id) values ($1, $3), ($2, $3)`, [
        ids.practitioner,
        ids.other,
        ids.massage,
      ]);
      expect(await bookable()).toBe(false); // approved, but no credential

      const cred = (
        await db.query(
          `insert into practitioner_credentials (practitioner_id, credential_type, status)
           values ($1, 'massage_therapy', 'pending') returning id`,
          [ids.practitioner],
        )
      ).rows[0].id;
      expect(await bookable()).toBe(false); // pending is not verified

      await db.query(
        `update practitioner_credentials set status = 'verified', verified_by = $2, verified_at = now(),
           expires_on = current_date - 1 where id = $1`,
        [cred, ids.owner],
      );
      expect(await bookable()).toBe(false); // verified but expired

      await db.query(`update practitioner_credentials set expires_on = current_date + 365 where id = $1`, [cred]);
      expect(await bookable()).toBe(true);
    });

    it("cannot mark a credential verified without a verifier", async () => {
      const code = await sqlState(
        db.query(
          `insert into practitioner_credentials (practitioner_id, credential_type, status)
           values ($1, 'massage_therapy', 'verified')`,
          [ids.other],
        ),
      );
      expect(code).toBe("23514");
    });

    it("rejects an appointment with a practitioner who lacks the credential", async () => {
      const code = await sqlState(db.query(appointment("2030-01-07T10:00:00Z", { practitioner_id: ids.other })));
      expect(code).toBe("23514");
    });
  });

  describe("double-booking protection", () => {
    it("rejects overlapping appointments, including the buffer, and frees cancelled slots", async () => {
      const first = (await db.query(appointment("2030-02-04T10:00:00Z"))).rows[0].id;

      expect(await sqlState(db.query(appointment("2030-02-04T10:30:00Z", { client_id: ids.clientB })))).toBe("23P01");
      // 11:00 start collides with the 15-minute buffer after the first appointment.
      expect(await sqlState(db.query(appointment("2030-02-04T11:00:00Z", { client_id: ids.clientB })))).toBe("23P01");
      // Unpaid holds block the slot too.
      expect(
        await sqlState(db.query(appointment("2030-02-04T09:30:00Z", { client_id: ids.clientB, status: "pending_payment" }))),
      ).toBe("23P01");

      expect(await sqlState(db.query(appointment("2030-02-04T11:15:00Z", { client_id: ids.clientB })))).toBeNull();

      await db.query(`update appointments set status = 'cancelled' where id = $1`, [first]);
      expect(await sqlState(db.query(appointment("2030-02-04T10:00:00Z", { client_id: ids.clientB })))).toBeNull();
    });

    it("lets exactly one of several simultaneous bookings for the same slot succeed", async () => {
      const clients = await Promise.all(Array.from({ length: 6 }, connect));
      try {
        const results = await Promise.all(
          clients.map((c, i) => sqlState(c.query(appointment("2030-03-04T15:00:00Z", { client_id: i % 2 ? ids.clientA : ids.clientB })))),
        );
        expect(results.filter((r) => r === null)).toHaveLength(1);
        expect(results.filter((r) => r === "23P01")).toHaveLength(5);
      } finally {
        await Promise.all(clients.map((c) => c.end()));
      }
    });

    it("derives end time and blocked window from duration and buffers", async () => {
      const id = (await db.query(appointment("2030-04-01T10:00:00Z", { service_variant_id: ids.v90, duration_min: 90, buffer_before_min: 10 }))).rows[0].id;
      const row = (await db.query(`select ends_at, blocked_from, blocked_until, service_id from appointments where id = $1`, [id])).rows[0];
      expect(row.ends_at.toISOString()).toBe("2030-04-01T11:30:00.000Z");
      expect(row.blocked_from.toISOString()).toBe("2030-04-01T09:50:00.000Z");
      expect(row.blocked_until.toISOString()).toBe("2030-04-01T11:45:00.000Z");
      expect(row.service_id).toBe(ids.massage);
    });
  });

  describe("row-level security", () => {
    beforeAll(async () => {
      await db.query(appointment("2030-05-06T10:00:00Z", { client_id: ids.clientA }));
      await db.query(`insert into intake_forms (client_id, form_version, responses) values ($1, 'v1', '{"note":"private"}')`, [ids.clientA]);
      await db.query(`insert into client_notes (client_id, author_id, body, visibility) values ($1, $2, 'care', 'care_team'), ($1, $2, 'admin', 'admin_only')`, [ids.clientA, ids.owner]);
      await db.query(`insert into waitlist_entries (email, interest) values ('lead@example.test', 'lounge')`);
    });

    const count = (c: Client, table: string) => c.query(`select count(*)::int n from ${table}`).then((r) => r.rows[0].n as number);

    it("shows clients only their own appointments and intake forms", async () => {
      const a = await as("authenticated", ids.clientA, async (c) => [await count(c, "appointments"), await count(c, "intake_forms")]);
      const b = await as("authenticated", ids.clientB, async (c) => [
        (await c.query(`select count(*)::int n from appointments where client_id = $1`, [ids.clientA])).rows[0].n,
        await count(c, "intake_forms"),
        await count(c, "profiles"),
      ]);
      expect(a[0]).toBeGreaterThan(0);
      expect(a[1]).toBe(1);
      expect(b).toEqual([0, 0, 1]);
    });

    it("never shows client notes to clients, and only care-team notes to the treating practitioner", async () => {
      expect(await as("authenticated", ids.clientA, (c) => count(c, "client_notes"))).toBe(0);
      const seen = await as("authenticated", ids.pracUser, async (c) => (await c.query(`select body from client_notes`)).rows.map((r) => r.body));
      expect(seen).toEqual(["care"]);
      expect(await as("authenticated", ids.owner, (c) => count(c, "client_notes"))).toBe(2);
    });

    it("limits intake access to the treating practitioner, not every practitioner", async () => {
      expect(await as("authenticated", ids.pracUser, (c) => count(c, "intake_forms"))).toBe(1);
      // Client B has no appointment with this practitioner in the access window.
      await db.query(`insert into intake_forms (client_id, form_version, responses) values ($1, 'v1', '{}')`, [ids.clientB]);
      await db.query(`delete from appointments where client_id = $1`, [ids.clientB]);
      expect(await as("authenticated", ids.pracUser, (c) => count(c, "intake_forms"))).toBe(1);
    });

    it("blocks clients from promoting themselves or writing appointments directly", async () => {
      const promote = await as("authenticated", ids.clientA, (c) =>
        sqlState(c.query(`update profiles set role = 'owner' where id = $1`, [ids.clientA])),
      );
      expect(promote).toBe("42501");
      const insert = await as("authenticated", ids.clientA, (c) => sqlState(c.query(appointment("2031-01-01T10:00:00Z"))));
      expect(insert).toBe("42501");
    });

    it("lets an owner change roles, and stops an admin creating owners", async () => {
      const owner = await as("authenticated", ids.owner, (c) =>
        sqlState(c.query(`update profiles set role = 'admin' where id = $1`, [ids.clientB])),
      );
      expect(owner).toBeNull();
      await db.query(`update profiles set role = 'admin' where id = $1`, [ids.clientB]);
      const admin = await as("authenticated", ids.clientB, (c) =>
        sqlState(c.query(`update profiles set role = 'owner' where id = $1`, [ids.clientA])),
      );
      expect(admin).toBe("42501");
      await db.query(`update profiles set role = 'client' where id = $1`, [ids.clientB]);
    });

    it("keeps leads, settings, and the rate limiter away from visitors", async () => {
      const anon = await as("anon", null, async (c) => [await count(c, "waitlist_entries"), await count(c, "settings"), await count(c, "audit_logs")]);
      expect(anon).toEqual([0, 0, 0]);
      const insert = await as("anon", null, (c) => sqlState(c.query(`insert into waitlist_entries (email, interest) values ('x@example.test', 'lounge')`)));
      expect(insert).toBe("42501");
      const rpc = await as("anon", null, (c) => sqlState(c.query(`select check_rate_limit('k', 1, 60)`)));
      expect(rpc).toBe("42501");
    });
  });

  describe("operations", () => {
    it("rate limits per key within a window", async () => {
      const hit = async () => (await db.query(`select check_rate_limit('test-key', 2, 3600) ok`)).rows[0].ok;
      expect([await hit(), await hit(), await hit()]).toEqual([true, true, false]);
    });

    it("records price changes in an audit log that API roles cannot alter", async () => {
      await db.query(`update service_variants set price_cents = 12500 where id = $1`, [ids.v60]);
      const log = (await db.query(`select action, before ->> 'price_cents' b, after ->> 'price_cents' a from audit_logs where entity = 'service_variants' order by id desc limit 1`)).rows[0];
      expect(log).toEqual({ action: "update", b: "12000", a: "12500" });
      await db.query(`update service_variants set price_cents = 12000 where id = $1`, [ids.v60]);
      const tamper = await as("authenticated", ids.owner, (c) => sqlState(c.query(`delete from audit_logs`)));
      expect(tamper).toBe("42501");
    });

    it("keeps intake contents out of the audit log", async () => {
      const n = (await db.query(`select count(*)::int n from audit_logs where entity in ('intake_forms', 'consent_records', 'client_notes')`)).rows[0].n;
      expect(n).toBe(0);
    });

    it("refuses to publish a testimonial without consent and approval", async () => {
      expect(await sqlState(db.query(`insert into testimonials (author_display, quote, is_published) values ('X', 'Y', true)`))).toBe("23514");
    });

    it("refuses reservations for equipment that is not active", async () => {
      const loc = (await db.query(`select id from locations where slug = 'the-atlas-lounge'`)).rows[0].id;
      const eq = (await db.query(`insert into equipment (location_id, name, kind) values ($1, 'Cold plunge', 'cold_plunge') returning id`, [loc])).rows[0].id;
      const code = await sqlState(
        db.query(`insert into equipment_reservations (equipment_id, client_id, starts_at, ends_at) values ($1, $2, '2031-01-01T10:00Z', '2031-01-01T10:30Z')`, [eq, ids.clientA]),
      );
      expect(code).toBe("23514");
    });
  });
});
