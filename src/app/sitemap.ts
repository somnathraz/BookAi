import type { MetadataRoute } from "next";

import { listPublishedSlugs } from "@/lib/accounts";
import { absoluteUrl } from "@/lib/seo";
import { getPublicSiteUrl, subdomainSitesEnabled } from "@/lib/site-url";

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
  const staticPages: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // A sitemap may only contain URLs belonging to its own host. Wildcard
  // subdomains and verified customer domains expose their own sitemap instead.
  if (subdomainSitesEnabled()) return staticPages;

  try {
    const published = await listPublishedSlugs();
    const siteEntries: MetadataRoute.Sitemap = published
      .filter(({ customDomain, customDomainVerified }) =>
        !(customDomainVerified && customDomain)
      )
      .map(({ slug, updatedAt }) => ({
        url: getPublicSiteUrl(slug),
        lastModified: updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      }));
    return [...staticPages, ...siteEntries];
  } catch {
    return staticPages;
  }
}
