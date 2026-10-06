import type { MetadataRoute } from "next";

import { listPublishedSlugs } from "@/lib/accounts";
import { absoluteUrl } from "@/lib/seo";
import { getPublicSiteUrl, subdomainSitesEnabled } from "@/lib/site-url";
import {
  BLOG_INDEX_PAGE_SIZE,
  listBlogCategories,
  listUniqueBlogArticles,
} from "@/features/content/blog/blog-helpers";
import { blogArticleModifiedAt } from "@/features/content/blog/blog-registry";

/** Marketing + legal pages on the apex domain. */
const STATIC_PAGES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/refunds", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = listUniqueBlogArticles();
  const latestBlog = articles.reduce<string | undefined>((latest, article) => {
    const modified = blogArticleModifiedAt(article);
    if (!latest || modified > latest) return modified;
    return latest;
  }, undefined);

  const staticPages: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
    ...(page.path === "/blog" && latestBlog ? { lastModified: latestBlog } : {}),
  }));

  const blogPages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: absoluteUrl(`/blog/${article.slug}`),
    lastModified: blogArticleModifiedAt(article),
    // Google largely ignores changefreq/priority; lastmod must stay accurate.
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const categoryPages: MetadataRoute.Sitemap = listBlogCategories().map(
    (category) => ({
      url: absoluteUrl(`/blog/category/${category.slug}`),
      changeFrequency: "weekly",
      priority: 0.65,
      ...(latestBlog ? { lastModified: latestBlog } : {}),
    })
  );

  const restCount = Math.max(0, articles.length - 1);
  const totalBlogPages = Math.max(1, Math.ceil(restCount / BLOG_INDEX_PAGE_SIZE));
  const blogPaginationPages: MetadataRoute.Sitemap = Array.from(
    { length: Math.max(0, totalBlogPages - 1) },
    (_, index) => ({
      url: absoluteUrl(`/blog/page/${index + 2}`),
      changeFrequency: "weekly" as const,
      priority: 0.55,
      ...(latestBlog ? { lastModified: latestBlog } : {}),
    })
  );

  const marketing = [
    ...staticPages,
    ...blogPages,
    ...categoryPages,
    ...blogPaginationPages,
  ];

  // A sitemap may only contain URLs belonging to its own host. Wildcard
  // subdomains and verified customer domains expose their own sitemap instead.
  if (subdomainSitesEnabled()) return marketing;

  try {
    const published = await listPublishedSlugs();
    const siteEntries: MetadataRoute.Sitemap = published
      .filter(
        ({ customDomain, customDomainVerified }) =>
          !(customDomainVerified && customDomain)
      )
      .map(({ slug, updatedAt }) => ({
        url: getPublicSiteUrl(slug),
        lastModified: updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      }));
    return [...marketing, ...siteEntries];
  } catch {
    return marketing;
  }
}
