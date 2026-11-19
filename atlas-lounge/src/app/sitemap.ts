import type { MetadataRoute } from "next";
import { getServices } from "@/lib/catalog";
import { site } from "@/lib/site";

const pages = [
  "",
  "/about",
  "/services",
  "/pricing",
  "/book",
  "/memberships",
  "/mobile-sessions",
  "/future-lounge",
  "/faqs",
  "/contact",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = await getServices();
  return [
    ...pages.map((path) => ({ url: `${site.url}${path}` })),
    // Draft services are never listed, even when previewing drafts locally.
    ...services
      .filter((service) => service.status === "published")
      .map((service) => ({ url: `${site.url}/services/${service.slug}` })),
  ];
}
