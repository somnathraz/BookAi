import "server-only";

import { listRecentPublicSiteRows } from "@/lib/accounts";
import { domainLabel } from "@/lib/extract/shared";
import { isProxiableImageUrl, proxyGalleryUrl } from "@/lib/image-proxy";
import type { PublicSiteCard } from "@/lib/public-sites";
import { getPublicSiteHref } from "@/lib/site-url";
import type { BusinessDomain } from "@/lib/types";

function toPublicPhotoUrl(raw?: string): string | undefined {
  if (!raw || raw.startsWith("data:")) return undefined;
  if (raw.startsWith("/")) return raw;
  if (isProxiableImageUrl(raw)) return proxyGalleryUrl(raw);
  if (/^https?:\/\//i.test(raw)) return raw;
  return undefined;
}

function asBusinessDomain(value: string): BusinessDomain {
  const allowed: BusinessDomain[] = [
    "developer",
    "designer",
    "doctor",
    "consultant",
    "photographer",
    "restaurant",
    "fitness",
    "other",
  ];
  return (allowed.includes(value as BusinessDomain) ? value : "other") as BusinessDomain;
}

export async function listRecentPublicSites(limit = 8): Promise<PublicSiteCard[]> {
  const rows = await listRecentPublicSiteRows(limit);
  return rows.map((row) => {
    const domain = asBusinessDomain(row.domain);
    const customDomain =
      row.customDomainVerified && row.customDomain ? row.customDomain : undefined;
    return {
      slug: row.slug,
      name: row.name,
      domain,
      domainLabel: domainLabel(domain),
      tagline: row.tagline,
      photoUrl: toPublicPhotoUrl(row.photo),
      href: getPublicSiteHref(row.slug, { customDomain }),
      publishedAt: row.publishedAt.toISOString(),
    };
  });
}
