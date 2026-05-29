import "server-only";

import { extractPalette } from "@/lib/extract/palette";
import { buildMapEmbedUrl, buildStoreHours } from "@/lib/hours";
import { analyzeCore, buildAnalysis, guessDomain } from "@/lib/extract/shared";
import type { AnalysisResult, BusinessDomain } from "@/lib/types";

interface PlacesReview {
  text?: { text?: string };
  authorAttribution?: { displayName?: string };
  rating?: number;
}

interface Place {
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  reviews?: PlacesReview[];
  photos?: { name?: string }[];
  editorialSummary?: { text?: string };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
}

function queryFromMapsUrl(rawUrl: string): string {
  const placeMatch = rawUrl.match(/\/place\/([^/@?]+)/);
  if (placeMatch) {
    return decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).trim();
  }
  try {
    const u = new URL(rawUrl);
    const q = u.searchParams.get("q");
    if (q) return q.trim();
  } catch {
    /* not a URL — treat as a plain search query */
  }
  return rawUrl.trim();
}

const TYPE_TO_DOMAIN: { match: string[]; domain: BusinessDomain }[] = [
  { match: ["dentist", "doctor", "hospital", "clinic", "physiotherapist", "health"], domain: "doctor" },
  { match: ["restaurant", "cafe", "bakery", "bar", "meal", "food"], domain: "restaurant" },
  { match: ["gym", "fitness", "yoga"], domain: "fitness" },
  { match: ["photographer"], domain: "photographer" },
];

function domainFromTypes(types: string[] = [], fallbackText = ""): BusinessDomain {
  const joined = types.join(" ").toLowerCase();
  for (const { match, domain } of TYPE_TO_DOMAIN) {
    if (match.some((m) => joined.includes(m))) return domain;
  }
  return guessDomain(`${joined} ${fallbackText}`);
}

export async function extractFromGoogleMaps(rawUrl: string): Promise<AnalysisResult> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) {
    throw new Error("Google Places isn't configured. Add GOOGLE_PLACES_API_KEY to enable Maps import.");
  }

  const textQuery = queryFromMapsUrl(rawUrl);
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.types,places.reviews,places.photos,places.editorialSummary,places.regularOpeningHours,places.currentOpeningHours,places.location,places.googleMapsUri",
    },
    body: JSON.stringify({ textQuery, maxResultCount: 1 }),
  });

  if (!res.ok) {
    throw new Error(`Google Places error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { places?: Place[] };
  const place = data.places?.[0];
  if (!place) {
    throw new Error("Couldn't find that business on Google. Check the link or try the business name.");
  }

  const name = place.displayName?.text ?? "";
  const domain = domainFromTypes(place.types, name);

  // Google Places (New) returns up to 5 reviews and ~10 photos per place; we
  // take everything it gives us (cap 20) so the gallery & reviews feel full.
  const testimonials = (place.reviews ?? [])
    .filter((r) => r.text?.text)
    .slice(0, 20)
    .map((r) => ({
      quote: r.text!.text!,
      author: r.authorAttribution?.displayName ?? "Google reviewer",
      role: "Google review",
      rating: typeof r.rating === "number" ? r.rating : 5,
      verified: true, // straight from Google Business
    }));

  const photoNames = (place.photos ?? [])
    .map((p) => p.name)
    .filter((n): n is string => Boolean(n))
    .slice(0, 20);
  // Client gets proxied URLs (key stays server-side); palette is extracted here
  // from the direct media URLs which include the key.
  const images = photoNames.map((n) => `/api/photo?name=${encodeURIComponent(n)}`);
  const directUrls = photoNames
    .slice(0, 6)
    .map(
      (n) =>
        `https://places.googleapis.com/v1/${n}/media?maxHeightPx=400&maxWidthPx=400&key=${key}`
    );
  const palette = await extractPalette(directUrls, 3);

  // Let AI craft tagline/bio/services from the real signals; authoritative
  // facts (name, location, phone, domain, reviews) are then forced from Google.
  const signal = [
    `Business name: ${name}`,
    `Category: ${(place.types ?? []).join(", ")}`,
    place.rating ? `Rating: ${place.rating} from ${place.userRatingCount} reviews` : "",
    place.editorialSummary?.text ? `Summary: ${place.editorialSummary.text}` : "",
    testimonials.length
      ? `Sample reviews:\n${testimonials.map((t) => `- "${t.quote}"`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const core = await analyzeCore(
    signal,
    "The source is real Google Business data (name, category, rating, customer reviews). Write a warm tagline and bio grounded in what the reviews actually praise, and list the services this business clearly offers. Keep the real business name."
  );

  const address = place.formattedAddress ?? "";
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  const weekdayDescriptions =
    place.regularOpeningHours?.weekdayDescriptions ??
    place.currentOpeningHours?.weekdayDescriptions;
  const storeHours = buildStoreHours(
    weekdayDescriptions,
    place.currentOpeningHours?.openNow
  );
  const mapEmbedUrl = buildMapEmbedUrl({ address, lat, lng });
  const mapsUrl = place.googleMapsUri;

  core.profile = {
    ...core.profile,
    name: name || core.profile.name,
    domain,
    location: address || core.profile.location,
    phone: place.nationalPhoneNumber ?? core.profile.phone,
    bio: core.profile.bio ?? place.editorialSummary?.text,
    testimonials,
    storeHours,
    mapEmbedUrl,
    mapsUrl,
  };

  return buildAnalysis("maps", core, { images, palette });
}
