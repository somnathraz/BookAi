import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSiteBySlug, getSiteOwnerEmail, getPlan } from "@/lib/accounts";
import { bookingWhatsAppAllowed } from "@/lib/booking-plan";
import { PRODUCT_NAME } from "@/lib/brand";
import { brandingRemovalAllowed } from "@/lib/plan-features";
import { metaDescription, resolveOgImageUrl } from "@/lib/seo";
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
  if (!stored) {
    return {
      title: { absolute: "Site not found" },
      robots: { index: false, follow: false },
    };
  }

  const identity = stored.site?.identity;
  const name = identity?.name ?? stored.name ?? slug;
  const tagline = identity?.tagline ?? "";
  const intro =
    identity?.intro ??
    tagline ??
    `${name} — a one-page site built with ${PRODUCT_NAME}.`;
  const title = tagline ? `${name} — ${tagline}` : name;
  const description = metaDescription(intro);
  const customDomain =
    stored.customDomainVerified && stored.customDomain ? stored.customDomain : undefined;
  const url = getPublicSiteUrl(slug, { customDomain });
  const ogImage = resolveOgImageUrl(
    identity?.photo ?? stored.site.gallery?.[0]
  );

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: name,
      description: tagline || description,
      url,
      type: "website",
      siteName: name,
      locale: "en_IN",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: tagline || description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
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

  const ownerEmail = (await getSiteOwnerEmail(stored.id)) ?? "";
  const plan = ownerEmail ? await getPlan(ownerEmail) : "free";
  const showBookingWhatsApp =
    bookingWhatsAppAllowed(plan) &&
    Boolean(stored.site.booking?.whatsappNumber?.replace(/\D/g, "").length);
  const showBranding = !brandingRemovalAllowed(plan);

  return (
    <GeneratedSite
      site={stored.site}
      slug={slug}
      theme={stored.site.theme as ThemeMode}
      showBookingWhatsApp={showBookingWhatsApp}
      showBranding={showBranding}
    />
  );
}
