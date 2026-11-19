import { describe, expect, it } from "vitest";
import {
  catalogOptionsFromEnv,
  isRequestable,
  selectPackages,
  selectServices,
  startingPrice,
  type CatalogOptions,
} from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";

const live: CatalogOptions = { previewDrafts: false, credentialVerifiedSlugs: [] };

describe("catalog visibility", () => {
  it("shows only published services to the public", () => {
    const services = selectServices(live);
    expect(services.map((s) => s.slug)).toEqual(["massage"]);
    expect(services.every((s) => s.variants.every((v) => v.status === "published"))).toBe(true);
  });

  it("seeds the confirmed massage prices", () => {
    const [massage] = selectServices(live);
    expect(massage.variants.map((v) => [v.durationMin, v.priceCents])).toEqual([
      [60, 12000],
      [90, 17000],
      [120, 22000],
    ]);
    expect(startingPrice(massage)).toBe(12000);
  });

  it("keeps every proposed package as a hidden draft", () => {
    expect(selectPackages(live)).toEqual([]);
    const drafts = selectPackages({ ...live, previewDrafts: true });
    expect(drafts.map((p) => [p.slug, p.priceCents])).toEqual([
      ["essential-recovery", 44000],
      ["enhanced-recovery", 62000],
      ["performance-recovery", 84000],
      ["elite-recovery", 120000],
    ]);
    expect(drafts.every((p) => p.status === "draft")).toBe(true);
  });

  it("previews the proposed services at their proposed prices", () => {
    const all = selectServices({ ...live, previewDrafts: true });
    const prices = Object.fromEntries(
      all.map((s) => [s.slug, s.variants.map((v) => `${v.durationMin}:${v.priceCents}`).join(",")]),
    );
    expect(prices).toMatchObject({
      "myofascial-release": "60:13000",
      "stretch-and-mobility": "30:9000,60:15000",
      "muscle-activation": "30:8000,60:14000",
      "massage-and-muscle-activation": "60:15000,90:20000",
    });
  });
});

describe("draft preview flag", () => {
  it("is off by default", () => {
    expect(catalogOptionsFromEnv({}).previewDrafts).toBe(false);
  });
  it("can be enabled outside production", () => {
    expect(catalogOptionsFromEnv({ CATALOG_PREVIEW_DRAFTS: "true", VERCEL_ENV: "preview" }).previewDrafts).toBe(true);
  });
  it("is ignored on the production deployment", () => {
    expect(catalogOptionsFromEnv({ CATALOG_PREVIEW_DRAFTS: "true", VERCEL_ENV: "production" }).previewDrafts).toBe(false);
  });
});

describe("practitioner eligibility gate", () => {
  const all = selectServices({ ...live, previewDrafts: true });
  const massage = all.find((s) => s.slug === "massage")!;
  const draft = all.find((s) => s.slug === "stretch-and-mobility")!;

  it("blocks a licence-gated service until credentials are verified", () => {
    expect(isRequestable(massage, live)).toBe(false);
  });
  it("opens it once the business has verified credentials for that service", () => {
    const options = catalogOptionsFromEnv({ CREDENTIAL_VERIFIED_SERVICES: " massage , " });
    expect(isRequestable(massage, options)).toBe(true);
  });
  it("never opens a draft service, even one without a credential requirement", () => {
    expect(draft.requiredCredentialType).toBeNull();
    expect(isRequestable(draft, { previewDrafts: true, credentialVerifiedSlugs: [draft.slug] })).toBe(false);
  });
});

describe("formatPrice", () => {
  it("formats whole and fractional dollar amounts", () => {
    expect(formatPrice(12000)).toBe("$120");
    expect(formatPrice(120000)).toBe("$1,200");
    expect(formatPrice(1250)).toBe("$12.50");
  });
});
