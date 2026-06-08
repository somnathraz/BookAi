import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSiteBySlug } from "@/lib/accounts";
import { getPublicSiteUrl } from "@/lib/site-url";
import { GeneratedSite } from "@/components/generated/GeneratedSite";
import type { ThemeMode } from "@/lib/types";

// Each generated site is published at /<slug>. When NEXT_PUBLIC_SITE_DOMAIN is
// set, proxy.ts also rewrites <slug>.<domain> onto this same route, so
// both path and wildcard-subdomain URLs render the page. Static app routes
// (/pricing, /about, /dashboard) take precedence over this dynamic segment.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const stored = await getSiteBySlug(slug);
  if (!stored) return { title: "Site not found" };
  const identity = stored.site?.identity;
  const name = identity?.name ?? stored.name ?? slug;
  const tagline = identity?.tagline ?? "";
  const intro = identity?.intro ?? tagline;
  const url = getPublicSiteUrl(slug);
  return {
    title: tagline ? `${name} — ${tagline}` : name,
    description: intro,
    alternates: { canonical: url },
    openGraph: {
      title: name,
      description: tagline || intro,
      url,
      type: "website",
    },
  };
}

export default async function PublishedSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stored = await getSiteBySlug(slug);
  if (!stored) notFound();

  return (
    <GeneratedSite site={stored.site} theme={stored.site.theme as ThemeMode} />
  );
}
