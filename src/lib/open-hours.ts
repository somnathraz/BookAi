import type { HoursRow } from "@/lib/types";

// Parsing of Google-style weekday hours ("9:00 AM – 5:00 PM", "Closed",
// "Open 24 hours", split shifts) into minutes-from-midnight ranges. Shared by
// the live "Open now" badge and the LocalBusiness structured data.

export interface TimeRange {
  /** Minutes from midnight, e.g. 540 = 09:00. */
  open: number;
  /** Minutes from midnight; may be < open when the place closes after midnight. */
  close: number;
}

export type DayParse = TimeRange[] | "closed" | "always";

const TIME = /(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?/gi;

function toMinutes(hour: number, minute: number, meridiem: string): number {
  let h = hour % 12;
  if (meridiem.toLowerCase() === "p") h += 12;
  return h * 60 + minute;
}

/** Parse one day's hours string. Returns null when it can't be understood. */
export function parseDayHours(raw: string): DayParse | null {
  const s = raw.trim();
  if (!s) return null;
  if (/open\s*24\s*hours/i.test(s) || /\b24\s*hours\b/i.test(s)) return "always";
  if (/closed/i.test(s) && !/\d/.test(s)) return "closed";

  const ranges: TimeRange[] = [];
  // Each shift is "<time> – <time>"; multiple shifts are comma-separated.
  for (const segment of s.split(",")) {
    const times = [...segment.matchAll(TIME)];
    if (times.length < 2) continue;
    const open = toMinutes(Number(times[0][1]), Number(times[0][2] ?? 0), times[0][3]);
    const close = toMinutes(Number(times[1][1]), Number(times[1][2] ?? 0), times[1][3]);
    ranges.push({ open, close });
  }
  if (ranges.length) return ranges;
  return null;
}

function inRange(nowMin: number, r: TimeRange): boolean {
  if (r.close >= r.open) return nowMin >= r.open && nowMin < r.close;
  // Closes after midnight, e.g. 18:00 – 02:00.
  return nowMin >= r.open || nowMin < r.close;
}

/**
 * Compute whether the business is open at `now` (viewer's local clock).
 * Returns null when the hours can't be parsed, so callers can hide the badge
 * rather than show a wrong answer.
 */
export function isOpenNow(days: HoursRow[] | undefined, now: Date = new Date()): boolean | null {
  if (!days?.length) return null;
  const todayName = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const yesterdayName = new Date(now.getTime() - 864e5)
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  const find = (name: string) =>
    days.find((d) => d.label.trim().toLowerCase().startsWith(name));

  const today = find(todayName);
  if (!today) return null;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const parsed = parseDayHours(today.hours);
  if (parsed === null) return null;
  if (parsed === "always") return true;

  if (parsed !== "closed") {
    for (const r of parsed) if (inRange(nowMin, r)) return true;
  }

  // A shift from yesterday may run past midnight into today.
  const yest = find(yesterdayName);
  if (yest) {
    const yp = parseDayHours(yest.hours);
    if (Array.isArray(yp)) {
      for (const r of yp) if (r.close < r.open && nowMin < r.close) return true;
    }
  }

  return false;
}

const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface OpeningHoursSpec {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string;
  opens: string;
  closes: string;
}

/** Build schema.org openingHoursSpecification entries from per-day hours. */
export function toOpeningHoursSpec(days: HoursRow[] | undefined): OpeningHoursSpec[] {
  if (!days?.length) return [];
  const out: OpeningHoursSpec[] = [];
  for (const day of days) {
    const dayName = SCHEMA_DAYS.find((d) =>
      day.label.trim().toLowerCase().startsWith(d.toLowerCase())
    );
    if (!dayName) continue;
    const parsed = parseDayHours(day.hours);
    if (parsed === "always") {
      out.push({ "@type": "OpeningHoursSpecification", dayOfWeek: dayName, opens: "00:00", closes: "23:59" });
    } else if (Array.isArray(parsed)) {
      for (const r of parsed) {
        out.push({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: dayName,
          opens: hhmm(r.open),
          closes: hhmm(r.close),
        });
      }
    }
  }
  return out;
}
