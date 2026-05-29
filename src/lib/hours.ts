import type { HoursRow, StoreHours } from "@/lib/types";

/** Turn Google weekdayDescriptions into grouped rows (Mon–Wed, Thu–Fri, …). */
export function parseWeekdayDescriptions(descriptions: string[]): HoursRow[] {
  if (!descriptions.length) return [];

  const parsed = descriptions.map((line) => {
    const idx = line.indexOf(": ");
    if (idx === -1) return { day: line.trim(), hours: "Closed" };
    return {
      day: line.slice(0, idx).trim(),
      hours: line.slice(idx + 2).trim() || "Closed",
    };
  });

  const groups: HoursRow[] = [];
  let i = 0;
  while (i < parsed.length) {
    let j = i + 1;
    while (j < parsed.length && parsed[j].hours === parsed[i].hours) j++;
    const label =
      j - i === 1
        ? parsed[i].day
        : `${parsed[i].day} – ${parsed[j - 1].day}`;
    groups.push({ label, hours: parsed[i].hours });
    i = j;
  }
  return groups;
}

/** Ungrouped per-day rows (one per weekday) — used for live open/closed
 *  computation and structured data. */
function parsePerDay(descriptions: string[]): HoursRow[] {
  return descriptions.map((line) => {
    const idx = line.indexOf(": ");
    if (idx === -1) return { label: line.trim(), hours: "Closed" };
    return {
      label: line.slice(0, idx).trim(),
      hours: line.slice(idx + 2).trim() || "Closed",
    };
  });
}

export function buildStoreHours(
  weekdayDescriptions: string[] | undefined,
  openNow?: boolean
): StoreHours | undefined {
  const descriptions = weekdayDescriptions ?? [];
  const rows = parseWeekdayDescriptions(descriptions);
  if (!rows.length) return undefined;
  return {
    openNow,
    rows,
    days: parsePerDay(descriptions),
  };
}

/** A directions link for the location block. Prefers Google's canonical place
 *  URL; falls back to a Maps search built from the address. */
export function buildDirectionsUrl(opts: {
  mapsUrl?: string;
  address?: string;
}): string | undefined {
  if (opts.mapsUrl) return opts.mapsUrl;
  const address = opts.address?.trim();
  if (!address) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Google Maps iframe embed — no API key required. */
export function buildMapEmbedUrl(opts: {
  address?: string;
  lat?: number;
  lng?: number;
}): string | undefined {
  const q =
    opts.lat != null && opts.lng != null
      ? `${opts.lat},${opts.lng}`
      : opts.address?.trim();
  if (!q) return undefined;
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
}
