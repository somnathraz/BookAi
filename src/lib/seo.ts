import type { Metadata } from "next";

import { PRODUCT_NAME } from "@/lib/brand";
import { isProxiableImageUrl, proxyGalleryUrl } from "@/lib/image-proxy";
import { getAppBaseUrl } from "@/lib/site-url";

export const DEFAULT_TITLE = `${PRODUCT_NAME} — Turn your business into a website`;

export const DEFAULT_DESCRIPTION =
  "Find your business or start from a resume, an existing site, or a short guided brief. PaperChai creates a polished website you can review before publishing.";

export const SITE_KEYWORDS = [
  "AI website builder",
  "one-page website",
  "Google Business website",
  "resume to website",
  "LinkedIn to website",
  "small business website India",
  PRODUCT_NAME,
];

export function getMetadataBase(): URL {
  return new URL(getAppBaseUrl());
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, getMetadataBase()).toString();
}

export function defaultOgImage(): string {
  return absoluteUrl("/opengraph-image.png");
}

/** Trim and cap meta descriptions for search snippets. */
export function metaDescription(text: string, max = 160): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return DEFAULT_DESCRIPTION;
  if (cleaned.length <= max) return cleaned;
  const slice = cleaned.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${trimmed.trimEnd()}…`;
}

/** Resolve a site photo (or gallery URL) into an absolute OG image URL. */
export function resolveOgImageUrl(raw?: string | null): string {
  if (!raw || raw.startsWith("data:")) return defaultOgImage();
  if (raw.startsWith("/")) return absoluteUrl(raw);
  if (isProxiableImageUrl(raw)) return absoluteUrl(proxyGalleryUrl(raw));
  if (/^https?:\/\//i.test(raw)) return raw;
  return defaultOgImage();
}

interface PageMetaInput {
  title: string;
  description: string;
  path?: string;
  /** Use a full title that should not get the layout template suffix. */
  absoluteTitle?: boolean;
  noIndex?: boolean;
  ogImage?: string;
  keywords?: readonly string[];
  /** Extra alternate links (for example RSS). */
  alternatesTypes?: Record<string, string>;
}

export function pageMetadata({
  title,
  description,
  path = "/",
  absoluteTitle = false,
  noIndex = false,
  ogImage = defaultOgImage(),
  keywords,
  alternatesTypes,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const desc = metaDescription(description);
  const resolvedTitle = absoluteTitle ? { absolute: title } : title;

  return {
    title: resolvedTitle,
    description: desc,
    ...(keywords?.length ? { keywords: [...keywords] } : {}),
    alternates: {
      canonical: url,
      ...(alternatesTypes ? { types: alternatesTypes } : {}),
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url,
      siteName: PRODUCT_NAME,
      title,
      description: desc,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
  };
}

interface ArticleMetaInput extends PageMetaInput {
  publishedAt: string;
  modifiedAt?: string;
  authors?: readonly string[];
  section?: string;
}

/** Blog / article metadata with Open Graph article fields. */
export function articleMetadata({
  title,
  description,
  path = "/",
  absoluteTitle = false,
  noIndex = false,
  ogImage = defaultOgImage(),
  keywords,
  publishedAt,
  modifiedAt,
  authors = [PRODUCT_NAME],
  section,
}: ArticleMetaInput): Metadata {
  const base = pageMetadata({
    title,
    description,
    path,
    absoluteTitle,
    noIndex,
    ogImage,
    keywords,
  });
  const url = absoluteUrl(path);
  const desc = metaDescription(description);
  const modified = modifiedAt ?? publishedAt;

  return {
    ...base,
    openGraph: {
      type: "article",
      locale: "en_IN",
      url,
      siteName: PRODUCT_NAME,
      title,
      description: desc,
      publishedTime: publishedAt,
      modifiedTime: modified,
      authors: [...authors],
      ...(section ? { section } : {}),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}
