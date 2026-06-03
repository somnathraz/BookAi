import "server-only";

import { extractPalette } from "@/lib/extract/palette";
import { proxyGalleryUrls } from "@/lib/image-proxy";
import { buildMapEmbedUrl, buildStoreHours } from "@/lib/hours";
import { analyzeCore, buildAnalysis, guessDomain } from "@/lib/extract/shared";
import type { AnalysisResult, BusinessDomain, Testimonial } from "@/lib/types";

export const TYPE_TO_DOMAIN: { match: string[]; domain: BusinessDomain }[] = [
  {
    match: ["dentist", "doctor", "hospital", "clinic", "physiotherapist", "health"],
    domain: "doctor",
  },
  {
    match: ["restaurant", "cafe", "bakery", "bar", "meal", "food"],
    domain: "restaurant",
  },
  { match: ["gym", "fitness", "yoga"], domain: "fitness" },
  { match: ["photographer"], domain: "photographer" },
];

export function domainFromTypes(
  types: string[] = [],
  fallbackText = ""
): BusinessDomain {
  const joined = types.join(" ").toLowerCase();
  for (const { match, domain } of TYPE_TO_DOMAIN) {
    if (match.some((m) => joined.includes(m))) return domain;
  }
  return guessDomain(`${joined} ${fallbackText}`);
}

/** Follow maps.app.goo.gl short links to the full URL with place IDs. */
export async function resolveMapsUrl(rawUrl: string): Promise<string> {
  if (!rawUrl.includes("maps.app.goo.gl")) return rawUrl;
  try {
    const res = await fetch(rawUrl, { redirect: "follow" });
    return res.url.length > 20 ? res.url : rawUrl;
  } catch {
    return rawUrl;
  }
}

export function extractPlaceId(url: string): string | null {
  const chij = url.match(/[!&]1s(ChIJ[A-Za-z0-9_\-]+)/);
  if (chij) return chij[1];
  const gid = url.match(/[!&]16s(?:%2Fg%2F|\/g\/)([A-Za-z0-9_\-]+)/i);
  if (gid) return `/g/${gid[1]}`;
  const hex = url.match(/[!&]1s(0x[0-9a-fA-F]+(?:%3A|:)0x[0-9a-fA-F]+)/);
  if (hex) return decodeURIComponent(hex[1]);
  return null;
}

/** SerpAPI `data` parameter (hex CID pair). */
export function extractDataId(url: string): string | null {
  const hex = url.match(/[!&]1s(0x[0-9a-fA-F]+(?:%3A|:)0x[0-9a-fA-F]+)/);
  if (hex) return decodeURIComponent(hex[1]);
  const dataParam = url.match(/[?&]data=([^&]+)/);
  if (dataParam) return decodeURIComponent(dataParam[1]);
  return null;
}

export function extractLatLng(
  url: string
): { latitude: number; longitude: number } | null {
  const m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!m) return null;
  return { latitude: parseFloat(m[1]), longitude: parseFloat(m[2]) };
}

export function queryFromMapsUrl(rawUrl: string): string {
  const placeMatch = rawUrl.match(/\/place\/([^/@?]+)/);
  if (placeMatch) {
    return decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).trim();
  }
  try {
    const u = new URL(rawUrl);
    const q = u.searchParams.get("q");
    if (q) return q.trim();
  } catch {
    /* plain text query */
  }
  return rawUrl.trim();
}

export interface NormalizedMapsBusiness {
  name: string;
  types: string[];
  address: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
  openNow?: boolean;
  weekdayDescriptions: string[];
  lat?: number;
  lng?: number;
  mapsUrl?: string;
  testimonials: Testimonial[];
  imageUrls: string[];
}

export async function buildMapsAnalysis(
  business: NormalizedMapsBusiness
): Promise<AnalysisResult> {
  const domain = domainFromTypes(business.types, business.name);

  const palette = await extractPalette(business.imageUrls.slice(0, 6), 3);

  const signal = [
    `Business name: ${business.name}`,
    `Category: ${business.types.join(", ")}`,
    business.rating
      ? `Rating: ${business.rating} from ${business.reviewCount ?? "?"} reviews`
      : "",
    business.description ? `Summary: ${business.description}` : "",
    business.testimonials.length
      ? `Sample reviews:\n${business.testimonials.map((t) => `- "${t.quote}"`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const core = await analyzeCore(
    signal,
    "The source is real Google Business data (name, category, rating, customer reviews). Write a warm tagline and bio grounded in what the reviews actually praise, and list the services this business clearly offers. Keep the real business name."
  );

  const storeHours = buildStoreHours(
    business.weekdayDescriptions,
    business.openNow
  );
  const mapEmbedUrl = buildMapEmbedUrl({
    address: business.address,
    lat: business.lat,
    lng: business.lng,
  });

  core.profile = {
    ...core.profile,
    name: business.name || core.profile.name,
    domain,
    location: business.address || core.profile.location,
    phone: business.phone ?? core.profile.phone,
    bio: core.profile.bio ?? business.description,
    testimonials: business.testimonials,
    storeHours,
    mapEmbedUrl,
    mapsUrl: business.mapsUrl,
  };

  const images = proxyGalleryUrls(business.imageUrls);
  console.log("[maps] gallery", {
    raw: business.imageUrls.length,
    proxied: images.length,
  });

  return buildAnalysis("maps", core, {
    images,
    palette,
  });
}
