import { listUniqueBlogArticles } from "@/features/content/blog/blog-helpers";
import { PRODUCT_NAME } from "@/lib/brand";
import { absoluteUrl } from "@/lib/seo";

export const runtime = "nodejs";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const articles = listUniqueBlogArticles();
  const feedUrl = absoluteUrl("/blog/rss.xml");
  const blogUrl = absoluteUrl("/blog");

  const items = articles
    .map((article) => {
      const link = absoluteUrl(`/blog/${article.slug}`);
      const pubDate = new Date(`${article.publishedAt}T00:00:00Z`).toUTCString();
      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(article.category)}</category>
      <description>${escapeXml(article.description)}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${PRODUCT_NAME} journal`)}</title>
    <link>${escapeXml(blogUrl)}</link>
    <description>Practical guides for local businesses and independent professionals in India.</description>
    <language>en-in</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
