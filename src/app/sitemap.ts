import type { MetadataRoute } from "next";

import { listPublishedSlugs } from "@/lib/accounts";
import { absoluteUrl } from "@/lib/seo";
import { getPublicSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/pricing"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  try {
    const published = await listPublishedSlugs();
    const siteEntries: MetadataRoute.Sitemap = published.map(
      ({ slug, updatedAt }) => ({
        url: getPublicSiteUrl(slug),
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
