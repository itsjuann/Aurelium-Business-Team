import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Only the production deployment is indexable; previews and staging are not.
  const indexable = process.env.VERCEL_ENV === "production";
  return {
    rules: indexable ? { userAgent: "*", allow: "/", disallow: ["/login"] } : { userAgent: "*", disallow: "/" },
    sitemap: indexable ? `${site.url}/sitemap.xml` : undefined,
  };
}
