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

// ── URL resolution & place-ID extraction ─────────────────────────────────────

/**
 * Follow a maps.app.goo.gl short link to its final destination.
 * The redirected URL contains the place_id in its data segment, which lets us
 * do an exact lookup instead of an unreliable text search.
 */
async function resolveUrl(rawUrl: string): Promise<string> {
  if (!rawUrl.includes("maps.app.goo.gl")) return rawUrl;
  try {
    const res = await fetch(rawUrl, { redirect: "follow" });
    // res.url is the final URL after all redirects
    return res.url.length > 20 ? res.url : rawUrl;
  } catch {
    return rawUrl;
  }
}

/**
 * Extract a Google Place ID from a Maps URL.
 * Priority:
 *  1. ChIJ... base64 ID in !1s (modern, most common in Places API v1)
 *  2. /g/XXXX feature ID in !16s (canonical feature ID — present on most
 *     share links, more stable than hex)
 *  3. 0x...:0x... hex ID in !1s (legacy, but still accepted by the API)
 */
function extractPlaceId(url: string): string | null {
  // Priority 1: ChIJ base64 ID
  const chij = url.match(/[!&]1s(ChIJ[A-Za-z0-9_\-]+)/);
  if (chij) return chij[1];

  // Priority 2: /g/ feature ID (encoded as !16s%2Fg%2FXXXX or !16s/g/XXXX)
  const gid = url.match(/[!&]16s(?:%2Fg%2F|\/g\/)([A-Za-z0-9_\-]+)/i);
  if (gid) return `/g/${gid[1]}`;

  // Priority 3: legacy hex place ID
  const hex = url.match(/[!&]1s(0x[0-9a-fA-F]+(?:%3A|:)0x[0-9a-fA-F]+)/);
  if (hex) return decodeURIComponent(hex[1]);

  return null;
}

/** Extract lat/lng from the @lat,lng,zoom part of a Maps URL. */
function extractLatLng(
  url: string
): { latitude: number; longitude: number } | null {
  const m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!m) return null;
  return { latitude: parseFloat(m[1]), longitude: parseFloat(m[2]) };
}

/** Fall back to reading the text name from the URL for text search. */
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

// ── Places API helpers ────────────────────────────────────────────────────────

const FIELDS =
  "displayName,formattedAddress,nationalPhoneNumber,rating,userRatingCount,types,reviews,photos,editorialSummary,regularOpeningHours,currentOpeningHours,location,googleMapsUri";

/**
 * Direct place lookup by place_id — exact result, correct for multi-location
 * businesses. This is the primary path when we can extract the ID from the URL.
 */
async function fetchPlaceById(
  placeId: string,
  key: string
): Promise<Place | null> {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": FIELDS,
      },
    }
  );
  if (!res.ok) {
    console.warn(`[maps] place lookup failed (${res.status}) for id=${placeId}`);
    return null;
  }
  return (await res.json()) as Place;
}

/**
 * Text search with an optional lat/lng location bias.
 * The bias keeps the search within ~500 m of the shared pin — far more reliable
 * than an unbiased text query for chains or businesses with common names.
 */
async function fetchPlaceByQuery(
  query: string,
  bias: { latitude: number; longitude: number } | null,
  key: string
): Promise<Place | null> {
  const body: Record<string, unknown> = { textQuery: query, maxResultCount: 1 };
  if (bias) {
    body.locationBias = {
      circle: { center: bias, radius: 500 },
    };
  }

  // Text-search field mask prefixes every field with "places."
  const fieldMask = FIELDS.split(",")
    .map((f) => `places.${f}`)
    .join(",");

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Google Places error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { places?: Place[] };
  return data.places?.[0] ?? null;
}

// ── Domain classification ─────────────────────────────────────────────────────

const TYPE_TO_DOMAIN: { match: string[]; domain: BusinessDomain }[] = [
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

function domainFromTypes(
  types: string[] = [],
  fallbackText = ""
): BusinessDomain {
  const joined = types.join(" ").toLowerCase();
  for (const { match, domain } of TYPE_TO_DOMAIN) {
    if (match.some((m) => joined.includes(m))) return domain;
  }
  return guessDomain(`${joined} ${fallbackText}`);
}

// ── Main extractor ────────────────────────────────────────────────────────────

export async function extractFromGoogleMaps(rawUrl: string): Promise<AnalysisResult> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Google Places isn't configured. Add GOOGLE_PLACES_API_KEY to enable Maps import."
    );
  }

  // 1. Follow maps.app.goo.gl short links → full URL with embedded place_id.
  const fullUrl = await resolveUrl(rawUrl);

  // 2. Extract place_id and lat/lng from the URL.
  const placeId = extractPlaceId(fullUrl);
  const latLng = extractLatLng(fullUrl);

  // 3. Prefer direct lookup (exact); fall back to biased text search.
  let place: Place | null = null;

  if (placeId) {
    place = await fetchPlaceById(placeId, key);
  }

  if (!place) {
    const query = queryFromMapsUrl(fullUrl);
    // latLng bias keeps multi-location chain searches accurate even when
    // we couldn't extract a place_id.
    place = await fetchPlaceByQuery(query, latLng, key);
  }

  if (!place) {
    throw new Error(
      "Couldn't find that business on Google. Use the Share link from Google Maps (tap Share → Copy link) for the best results."
    );
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
      verified: true,
    }));

  const photoNames = (place.photos ?? [])
    .map((p) => p.name)
    .filter((n): n is string => Boolean(n))
    .slice(0, 20);
  const images = photoNames.map(
    (n) => `/api/photo?name=${encodeURIComponent(n)}`
  );
  const directUrls = photoNames
    .slice(0, 6)
    .map(
      (n) =>
        `https://places.googleapis.com/v1/${n}/media?maxHeightPx=400&maxWidthPx=400&key=${key}`
    );
  const palette = await extractPalette(directUrls, 3);

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
