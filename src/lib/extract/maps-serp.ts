import "server-only";

import { serpSearch } from "@/lib/serpapi/client";
import type { Testimonial } from "@/lib/types";

export interface SerpMapsBusiness {
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
  placeId?: string;
  dataId?: string;
  testimonials: Testimonial[];
  imageUrls: string[];
}

interface SerpPlaceRow {
  title?: string;
  address?: string;
  phone?: string;
  rating?: number;
  reviews?: number;
  type?: string | string[];
  types?: string[];
  description?: string;
  website?: string;
  open_state?: string;
  hours?: string | Record<string, string> | { [day: string]: string }[];
  operating_hours?: Record<string, string>;
  gps_coordinates?: { latitude?: number; longitude?: number };
  place_id?: string;
  data_id?: string;
  link?: string;
  thumbnail?: string;
  images?: { thumbnail?: string; image?: string }[];
}

interface SerpReview {
  rating?: number;
  snippet?: string;
  extracted_snippet?: { original?: string };
  user?: { name?: string };
}

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function parseOpenNow(openState?: string): boolean | undefined {
  if (!openState) return undefined;
  const s = openState.toLowerCase();
  if (s.includes("open")) return true;
  if (s.includes("closed")) return false;
  return undefined;
}

function operatingHoursToWeekdays(oh: Record<string, unknown>): string[] {
  return WEEKDAYS.map((day) => {
    const entry = Object.entries(oh).find(([k]) =>
      k.toLowerCase().startsWith(day.slice(0, 3).toLowerCase())
    );
    const raw = entry?.[1];
    const hours = typeof raw === "string" ? raw.trim() : "";
    return `${day}: ${hours || "Closed"}`;
  });
}

/** Normalize SerpAPI `hours` which may be a string, object map, or day objects. */
function hoursFieldToWeekdays(hours: unknown): string[] {
  if (typeof hours === "string" && hours.trim()) return [hours.trim()];
  if (Array.isArray(hours)) {
    const lines: string[] = [];
    for (const item of hours) {
      if (typeof item === "string" && item.trim()) {
        lines.push(item.trim());
        continue;
      }
      if (item && typeof item === "object") {
        for (const [day, value] of Object.entries(item as Record<string, unknown>)) {
          if (typeof value === "string" && value.trim()) {
            lines.push(`${day}: ${value.trim()}`);
          }
        }
      }
    }
    return lines;
  }
  if (hours && typeof hours === "object") {
    return operatingHoursToWeekdays(hours as Record<string, unknown>);
  }
  return [];
}

function normalizeTypes(row: SerpPlaceRow): string[] {
  const raw = row.types ?? (Array.isArray(row.type) ? row.type : row.type ? [row.type] : []);
  return raw.filter((t): t is string => typeof t === "string");
}

function rowToBusiness(row: SerpPlaceRow): Omit<SerpMapsBusiness, "testimonials" | "imageUrls"> {
  const lat = row.gps_coordinates?.latitude;
  const lng = row.gps_coordinates?.longitude;
  const weekdayDescriptions = row.operating_hours
    ? operatingHoursToWeekdays(row.operating_hours)
    : hoursFieldToWeekdays(row.hours);

  return {
    name: row.title ?? "",
    types: normalizeTypes(row),
    address: row.address ?? "",
    phone: row.phone,
    rating: row.rating,
    reviewCount: row.reviews,
    description: row.description,
    openNow: parseOpenNow(row.open_state),
    weekdayDescriptions,
    lat,
    lng,
    mapsUrl: row.link,
    placeId: row.place_id,
    dataId: row.data_id,
  };
}

/** Hex CID pair from Maps URLs — SerpAPI `data_cid` / `data_id`, not the deprecated `data` param. */
function isHexCid(id: string): boolean {
  return /^0x[0-9a-f]+:0x[0-9a-f]+$/i.test(id);
}

async function lookupPlaceById(
  spec: { place_id?: string; data_cid?: string },
  label: string
): Promise<SerpPlaceRow | null> {
  try {
    const data = await serpSearch({
      engine: "google_maps",
      type: "place",
      ...spec,
    });
    const place = data.place_results as SerpPlaceRow | undefined;
    if (place?.title) {
      console.log(`[maps][serp] matched via ${label} →`, place.title);
      return place;
    }
    console.log(`[maps][serp] ${label} miss`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[maps][serp] ${label} error:`, msg);
  }
  return null;
}

async function fetchPlace(params: {
  placeId?: string | null;
  dataId?: string | null;
  query?: string;
  lat?: number;
  lng?: number;
}): Promise<SerpPlaceRow | null> {
  // ChIJ place_id — exact match when present in the share URL.
  if (params.placeId?.startsWith("ChIJ")) {
    console.log("[maps][serp] lookup: place_id", params.placeId);
    const hit = await lookupPlaceById({ place_id: params.placeId }, "place_id");
    if (hit) return hit;
  }

  // Hex CID (0x…:0x…) — SerpAPI expects `data_cid`, not deprecated `data`.
  if (params.dataId && isHexCid(params.dataId)) {
    console.log("[maps][serp] lookup: data_cid", params.dataId);
    const hit = await lookupPlaceById({ data_cid: params.dataId }, "data_cid");
    if (hit) return hit;
  }

  if (params.query) {
    const searchParams: Record<string, string | number | undefined> = {
      engine: "google_maps",
      q: params.query,
    };
    if (params.lat != null && params.lng != null) {
      searchParams.ll = `@${params.lat},${params.lng},14z`;
    }
    console.log("[maps][serp] lookup: text search", {
      q: params.query,
      biased: params.lat != null,
    });
    const data = await serpSearch(searchParams);
    const place = (data.place_results ?? data.local_results) as
      | SerpPlaceRow
      | SerpPlaceRow[]
      | undefined;
    if (place && !Array.isArray(place) && place.title) {
      console.log("[maps][serp] matched via text search →", place.title);
      return place;
    }
    if (Array.isArray(place) && place[0]?.title) {
      const hit = place[0];
      console.log("[maps][serp] matched via local_results[0] →", hit.title);
      // Search hits are sparse — re-fetch full place for hours and photos.
      if (hit.place_id?.startsWith("ChIJ") || hit.data_id) {
        const full = await fetchPlace({
          placeId: hit.place_id,
          dataId: hit.data_id,
          // no query — avoid re-entering text search
        });
        if (full?.title) {
          console.log("[maps][serp] enriched local_results via place lookup");
          return full;
        }
      }
      return hit;
    }
    console.log("[maps][serp] text search miss");
  }

  return null;
}

async function fetchReviews(
  ids: { placeId?: string; dataId?: string },
  limit: number
): Promise<Testimonial[]> {
  const params: Record<string, string> = { engine: "google_maps_reviews", sort_by: "newestFirst" };
  if (ids.dataId && isHexCid(ids.dataId)) params.data_id = ids.dataId;
  else if (ids.placeId?.startsWith("ChIJ")) params.place_id = ids.placeId;
  else return [];

  try {
    const data = await serpSearch(params);
    const reviews = (data.reviews ?? []) as SerpReview[];
    const out: Testimonial[] = [];
    for (const r of reviews) {
      const quote =
        r.snippet?.trim() || r.extracted_snippet?.original?.trim() || "";
      if (!quote) continue;
      out.push({
        quote,
        author: r.user?.name ?? "Google reviewer",
        role: "Google review",
        rating: typeof r.rating === "number" ? r.rating : 5,
        verified: true,
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

function fullPhotoUrl(p: { image?: string; thumbnail?: string }): string | null {
  const u = p.image?.trim();
  return u || null;
}

async function fetchPhotos(
  ids: { dataId?: string; placeId?: string },
  limit: number
): Promise<string[]> {
  const hasDataId = ids.dataId && isHexCid(ids.dataId);
  const hasPlaceId = ids.placeId?.startsWith("ChIJ");
  if (!hasDataId && !hasPlaceId) return [];

  const urls: string[] = [];
  let nextToken: string | undefined;

  try {
    for (let page = 0; page < 4 && urls.length < limit; page++) {
      const params: Record<string, string> = { engine: "google_maps_photos" };
      if (hasDataId) params.data_id = ids.dataId!;
      else if (hasPlaceId) params.place_id = ids.placeId!;
      if (nextToken) params.next_page_token = nextToken;

      const data = await serpSearch(params);
      const photos = (data.photos ?? []) as { image?: string; thumbnail?: string }[];
      for (const p of photos) {
        const u = fullPhotoUrl(p);
        if (u) urls.push(u);
      }

      const pagination = data.serpapi_pagination as { next_page_token?: string } | undefined;
      nextToken = pagination?.next_page_token;
      if (!nextToken || photos.length === 0) break;
    }
  } catch (err) {
    console.warn("[maps][serp] google_maps_photos failed", err);
  }

  const unique = [...new Set(urls)];
  console.log("[maps][serp] google_maps_photos", {
    dataId: ids.dataId ?? null,
    placeId: ids.placeId ?? null,
    count: unique.length,
  });
  return unique.slice(0, limit);
}

function photosFromPlaceRow(row: SerpPlaceRow): string[] {
  const urls: string[] = [];
  for (const img of row.images ?? []) {
    const u = fullPhotoUrl(img);
    if (u) urls.push(u);
  }
  return urls;
}

/** Load a Google Maps listing via SerpAPI (place, reviews, photos). */
export async function fetchBusinessFromSerp(params: {
  placeId?: string | null;
  dataId?: string | null;
  query: string;
  lat?: number;
  lng?: number;
}): Promise<SerpMapsBusiness | null> {
  const row = await fetchPlace(params);
  if (!row?.title) return null;

  const base = rowToBusiness(row);
  const ids = { placeId: base.placeId, dataId: base.dataId };

  const [reviews, extraPhotos] = await Promise.all([
    fetchReviews(ids, 20),
    fetchPhotos(ids, 20),
  ]);

  // Prefer full-size photos from the photos engine; place row often has only ~5 thumbs.
  const imageUrls = [...new Set([...extraPhotos, ...photosFromPlaceRow(row)])].slice(0, 20);

  console.log("[maps][serp] enriched place", {
    name: base.name,
    reviews: reviews.length,
    photos: imageUrls.length,
    hours: base.weekdayDescriptions.length,
  });

  return {
    ...base,
    testimonials: reviews,
    imageUrls,
  };
}
