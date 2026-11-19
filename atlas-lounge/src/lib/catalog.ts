// Phase 1 catalog source. The public site reads the same catalog that seeds the database
// (src/content/catalog.json -> supabase/seed.sql). From Phase 2 these functions read from
// Supabase instead; their signatures are async so callers do not change.
import rawCatalog from "@/content/catalog.json";

export type CatalogStatus = "draft" | "published" | "archived";

export interface ServiceVariant {
  durationMin: number;
  priceCents: number;
  status: CatalogStatus;
}

export interface Service {
  slug: string;
  name: string;
  category: string;
  status: CatalogStatus;
  /** When set, the service needs a practitioner with a verified credential of this type. */
  requiredCredentialType: string | null;
  summary: string;
  description: string;
  includes: string[];
  designedFor: string[];
  whatToExpect: string[];
  precautions: string[];
  bufferBeforeMin: number;
  bufferAfterMin: number;
  variants: ServiceVariant[];
}

export interface Package {
  slug: string;
  name: string;
  summary: string;
  serviceSlug: string;
  durationMin: number;
  sessionCount: number;
  priceCents: number;
  status: CatalogStatus;
}

export interface CatalogOptions {
  /** Include draft items, for design review only. Never true in production. */
  previewDrafts: boolean;
  /** Slugs of credential-gated services whose practitioners' credentials are verified. */
  credentialVerifiedSlugs: string[];
}

const catalog = rawCatalog as { services: Service[]; packages: Package[] };

export function catalogOptionsFromEnv(
  env: Record<string, string | undefined> = process.env,
): CatalogOptions {
  return {
    // Draft preview is ignored on the production deployment no matter how it is configured.
    previewDrafts: env.CATALOG_PREVIEW_DRAFTS === "true" && env.VERCEL_ENV !== "production",
    credentialVerifiedSlugs: (env.CREDENTIAL_VERIFIED_SERVICES ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

function visible(status: CatalogStatus, options: CatalogOptions): boolean {
  return status === "published" || (status === "draft" && options.previewDrafts);
}

export function selectServices(options: CatalogOptions, source = catalog.services): Service[] {
  return source
    .filter((service) => visible(service.status, options))
    .map((service) => ({
      ...service,
      variants: service.variants.filter((variant) => visible(variant.status, options)),
    }))
    .filter((service) => service.variants.length > 0);
}

export function selectPackages(options: CatalogOptions, source = catalog.packages): Package[] {
  return source.filter((pkg) => visible(pkg.status, options));
}

/**
 * Whether the public may request this service. Drafts never are. A service that requires a
 * professional credential is only requestable once the business has verified a practitioner's
 * credentials for it. (From Phase 3 this is decided by the database: service_is_bookable.)
 */
export function isRequestable(service: Service, options: CatalogOptions): boolean {
  if (service.status !== "published") return false;
  if (!service.variants.some((variant) => variant.status === "published")) return false;
  if (service.requiredCredentialType === null) return true;
  return options.credentialVerifiedSlugs.includes(service.slug);
}

export function startingPrice(service: Service): number {
  return Math.min(...service.variants.map((variant) => variant.priceCents));
}

export async function getServices(): Promise<Service[]> {
  return selectServices(catalogOptionsFromEnv());
}

export async function getService(slug: string): Promise<Service | undefined> {
  return (await getServices()).find((service) => service.slug === slug);
}

export async function getPackages(): Promise<Package[]> {
  return selectPackages(catalogOptionsFromEnv());
}

export async function getRequestableServices(): Promise<Service[]> {
  const options = catalogOptionsFromEnv();
  return selectServices(options).filter((service) => isRequestable(service, options));
}
