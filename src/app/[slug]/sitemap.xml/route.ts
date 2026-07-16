import { getSiteBySlug } from "@/lib/accounts";
import { getPublicSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const stored = await getSiteBySlug(slug);
  if (!stored) return new Response("Not found", { status: 404 });

  const customDomain =
    stored.customDomainVerified && stored.customDomain
      ? stored.customDomain
      : undefined;
  const canonicalUrl = getPublicSiteUrl(slug, { customDomain });
  const lastModified = new Date(stored.updatedAt).toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(canonicalUrl)}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
