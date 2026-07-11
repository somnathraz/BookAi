import type { MetadataRoute } from "next";

import { listPublishedSlugs } from "@/lib/accounts";
import { absoluteUrl } from "@/lib/seo";
import { getPublicSiteUrl } from "@/lib/site-url";

/** Marketing + legal pages on the apex domain. */
const STATIC_PAGES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/refunds", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  try {
    const published = await listPublishedSlugs();
    const siteEntries: MetadataRoute.Sitemap = published.map(
      ({ slug, updatedAt, customDomain, customDomainVerified }) => ({
        // Prefer verified custom domain (matches page canonical); otherwise
        // subdomain URL when NEXT_PUBLIC_SITE_DOMAIN is set, else path URL.
        url: getPublicSiteUrl(slug, {
          customDomain:
            customDomainVerified && customDomain ? customDomain : undefined,
        }),
        lastModified: updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      })
    );
    return [...staticPages, ...siteEntries];
  } catch {
    return staticPages;
  }
}
