import "server-only";

import { serpApiAvailable, serpSearch } from "@/lib/serpapi/client";

export interface BusinessSearchResult {
  id: string;
  name: string;
  address: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  mapsUrl: string;
}

interface GooglePlaceResult {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  primaryTypeDisplayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
}

interface SerpPlaceResult {
  title?: string;
  address?: string;
  type?: string;
  rating?: number;
  reviews?: number;
  place_id?: string;
  data_id?: string;
  link?: string;
}

export function businessSearchAvailable(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim()) || serpApiAvailable();
}

function fallbackMapsUrl(name: string, address: string, placeId?: string): string {
  const params = new URLSearchParams({
    api: "1",
    query: [name, address].filter(Boolean).join(", "),
  });
  if (placeId) params.set("query_place_id", placeId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

async function searchGooglePlaces(query: string): Promise<BusinessSearchResult[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) return [];

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.primaryTypeDisplayName,places.rating,places.userRatingCount,places.googleMapsUri",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 5 }),
  });

  if (!res.ok) {
    throw new Error(`Google Places search failed (${res.status}).`);
  }

  const data = (await res.json()) as { places?: GooglePlaceResult[] };
  return (data.places ?? [])
    .filter((place) => place.displayName?.text)
    .map((place, index) => {
      const name = place.displayName!.text!;
      const address = place.formattedAddress ?? "";
      const id = place.id ?? `${name}-${index}`;
      return {
        id,
        name,
        address,
        category: place.primaryTypeDisplayName?.text,
        rating: place.rating,
        reviewCount: place.userRatingCount,
        // Keep the Places resource id in the URL. googleMapsUri can contain only
        // a decimal cid, which is not reliable enough for the import pipeline.
        mapsUrl: fallbackMapsUrl(name, address, place.id),
      };
    });
}

async function searchSerp(query: string): Promise<BusinessSearchResult[]> {
  if (!serpApiAvailable()) return [];

  const data = await serpSearch({ engine: "google_maps", q: query, type: "search" });
  const raw = data.local_results ?? data.place_results;
  const rows = Array.isArray(raw) ? (raw as SerpPlaceResult[]) : raw ? [raw as SerpPlaceResult] : [];

  return rows
    .filter((row) => row.title)
    .slice(0, 5)
    .map((row, index) => {
      const name = row.title!;
      const address = row.address ?? "";
      const id = row.place_id ?? row.data_id ?? `${name}-${index}`;
      return {
        id,
        name,
        address,
        category: row.type,
        rating: row.rating,
        reviewCount: row.reviews,
        mapsUrl: row.link ?? fallbackMapsUrl(name, address, row.place_id),
      };
    });
}

export async function searchBusinesses(query: string): Promise<BusinessSearchResult[]> {
  const googleResults = await searchGooglePlaces(query);
  if (googleResults.length) return googleResults;
  return searchSerp(query);
}
