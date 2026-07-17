import "server-only";

import { serpApiAvailable } from "@/lib/serpapi/client";
import { env } from "@/platform/config/env";
import { fetchBusinessFromSerp } from "@/lib/extract/maps-serp";
import {
  buildMapsAnalysis,
  extractDataId,
  extractLatLng,
  extractPlaceId,
  queryFromMapsUrl,
  resolveMapsUrl,
  type NormalizedMapsBusiness,
} from "@/lib/extract/maps-shared";
import type { AnalysisResult } from "@/lib/types";

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

const FIELDS =
  "displayName,formattedAddress,nationalPhoneNumber,rating,userRatingCount,types,reviews,photos,editorialSummary,regularOpeningHours,currentOpeningHours,location,googleMapsUri";

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
    console.warn(`[maps][google] place_id lookup failed (${res.status})`, placeId);
    return null;
  }
  console.log("[maps][google] matched via place_id");
  return (await res.json()) as Place;
}

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
  const hit = data.places?.[0] ?? null;
  if (hit) {
    console.log("[maps][google] matched via text search →", hit.displayName?.text);
  } else {
    console.log("[maps][google] text search miss", { query });
  }
  return hit;
}

function placeToBusiness(place: Place): NormalizedMapsBusiness {
  const name = place.displayName?.text ?? "";
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
  const imageUrls = photoNames.map(
    (n) => `/api/photo?name=${encodeURIComponent(n)}`
  );

  const weekdayDescriptions =
    place.regularOpeningHours?.weekdayDescriptions ??
    place.currentOpeningHours?.weekdayDescriptions ??
    [];

  return {
    name,
    types: place.types ?? [],
    address: place.formattedAddress ?? "",
    phone: place.nationalPhoneNumber,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    description: place.editorialSummary?.text,
    openNow: place.currentOpeningHours?.openNow,
    weekdayDescriptions,
    lat: place.location?.latitude,
    lng: place.location?.longitude,
    mapsUrl: place.googleMapsUri,
    testimonials,
    imageUrls,
  };
}

async function fetchBusinessFromGoogle(
  fullUrl: string
): Promise<NormalizedMapsBusiness | null> {
  const key = env.googlePlacesApiKey;
  if (!key) return null;

  const placeId = extractPlaceId(fullUrl);
  const latLng = extractLatLng(fullUrl);

  let place: Place | null = null;
  if (placeId) {
    place = await fetchPlaceById(placeId, key);
  }
  if (!place) {
    const query = queryFromMapsUrl(fullUrl);
    place = await fetchPlaceByQuery(query, latLng, key);
  }
  if (!place) return null;

  return placeToBusiness(place);
}

export async function extractFromGoogleMaps(rawUrl: string): Promise<AnalysisResult> {
  const hasSerp = serpApiAvailable();
  const hasGoogle = Boolean(env.googlePlacesApiKey);

  if (!hasSerp && !hasGoogle) {
    throw new Error(
      "Maps import isn't configured. Add SERP_API_KEY (recommended) or GOOGLE_PLACES_API_KEY to .env."
    );
  }

  console.log("[maps] import start", {
    serpApi: hasSerp,
    googlePlaces: hasGoogle,
    tryOrder: hasSerp
      ? hasGoogle
        ? ["serpapi", "google-places"]
        : ["serpapi"]
      : ["google-places"],
  });

  const fullUrl = await resolveMapsUrl(rawUrl);
  const placeId = extractPlaceId(fullUrl);
  const dataId = extractDataId(fullUrl);
  const latLng = extractLatLng(fullUrl);
  const query = queryFromMapsUrl(fullUrl);

  console.log("[maps] url parsed", {
    shortened: rawUrl.includes("maps.app.goo.gl"),
    placeId: placeId ?? null,
    dataId: dataId ?? null,
    query,
    latLng: latLng ?? null,
  });

  if (hasSerp) {
    console.log("[maps] using SerpAPI (primary)");
    const serp = await fetchBusinessFromSerp({
      placeId: placeId?.startsWith("ChIJ") ? placeId : null,
      dataId: dataId ?? (placeId?.startsWith("0x") ? placeId : null),
      query,
      lat: latLng?.latitude,
      lng: latLng?.longitude,
    });
    if (serp) {
      console.log("[maps] provider=serpapi", {
        name: serp.name,
        reviews: serp.testimonials.length,
        photos: serp.imageUrls.length,
      });
      return buildMapsAnalysis({
        name: serp.name,
        types: serp.types,
        address: serp.address,
        phone: serp.phone,
        rating: serp.rating,
        reviewCount: serp.reviewCount,
        description: serp.description,
        openNow: serp.openNow,
        weekdayDescriptions: serp.weekdayDescriptions,
        lat: serp.lat,
        lng: serp.lng,
        mapsUrl: serp.mapsUrl ?? fullUrl,
        testimonials: serp.testimonials,
        imageUrls: serp.imageUrls,
      });
    }
    console.warn("[maps] SerpAPI found no place", hasGoogle ? "→ trying Google Places" : "");
  }

  if (!hasGoogle) {
    throw new Error(
      "Couldn't find that business on Google. Use the Share link from Google Maps (tap Share → Copy link) for the best results."
    );
  }

  console.log("[maps] using Google Places", hasSerp ? "(fallback)" : "(primary)");
  const google = await fetchBusinessFromGoogle(fullUrl);
  if (google) {
    console.log("[maps] provider=google-places", {
      name: google.name,
      reviews: google.testimonials.length,
      photos: google.imageUrls.length,
    });
    return buildMapsAnalysis(google);
  }

  throw new Error(
    "Couldn't find that business on Google. Use the Share link from Google Maps (tap Share → Copy link) for the best results."
  );
}
