import { getSiteBySlug } from "@/lib/accounts";
import { getPublicSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

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
  const host = new URL(canonicalUrl).host;
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    `Sitemap: ${canonicalUrl}/sitemap.xml`,
    `Host: ${host}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
