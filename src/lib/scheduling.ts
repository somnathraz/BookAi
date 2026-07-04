import { parseDayHours } from "@/lib/open-hours";
import type { DaySlotConfig, NativeSchedulingConfig, SiteData, StoreHours } from "@/lib/types";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export interface TimeSlot {
  /** ISO 8601 start instant */
  start: string;
  /** Display label, e.g. "10:00 AM" */
  label: string;
}

function parseHm(hm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function formatSlotLabel(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function dayConfigFromStoreHours(storeHours: StoreHours | undefined, dayIndex: number): DaySlotConfig | null {
  const name = WEEKDAY_NAMES[dayIndex];
  const row = storeHours?.days?.find((d) =>
    d.label.trim().toLowerCase().startsWith(name.toLowerCase())
  );
  if (!row) return null;
  const parsed = parseDayHours(row.hours);
  if (!parsed || parsed === "closed") return null;
  if (parsed === "always") {
    return { day: dayIndex, start: "09:00", end: "17:00" };
  }
  const first = parsed[0];
  const last = parsed[parsed.length - 1];
  const startH = Math.floor(first.open / 60);
  const startM = first.open % 60;
  const endH = Math.floor(last.close / 60);
  const endM = last.close % 60;
  return {
    day: dayIndex,
    start: `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`,
    end: `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`,
  };
}

export function resolveDayConfig(
  native: NativeSchedulingConfig,
  site: SiteData,
  dayIndex: number
): DaySlotConfig | null {
  const fromWeekly = native.weekly.find((d) => d.day === dayIndex);
  if (fromWeekly) return fromWeekly;
  return dayConfigFromStoreHours(site.storeHours, dayIndex);
}

/** Default Mon–Sat 10:00–18:00 for new native scheduling. */
export function defaultWeeklyAvailability(): DaySlotConfig[] {
  return [1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    start: "10:00",
    end: "18:00",
  }));
}

export function generateSlotsForDate(
  site: SiteData,
  native: NativeSchedulingConfig,
  dateIso: string,
  bookedStarts: Set<string>,
  now: Date = new Date()
): TimeSlot[] {
  if (native.blackoutDates?.includes(dateIso)) return [];

  const parts = dateIso.split("-").map(Number);
  if (parts.length !== 3) return [];
  const [y, mo, d] = parts;
  const dayDate = new Date(y, mo - 1, d);
  if (Number.isNaN(dayDate.getTime())) return [];

  const dayIndex = dayDate.getDay();
  const dayCfg = resolveDayConfig(native, site, dayIndex);
  if (!dayCfg) return [];

  const openMin = parseHm(dayCfg.start);
  const closeMin = parseHm(dayCfg.end);
  if (openMin === null || closeMin === null || closeMin <= openMin) return [];

  const slotMinutes = native.slotMinutes ?? 30;
  const slots: TimeSlot[] = [];

  for (let t = openMin; t + slotMinutes <= closeMin; t += slotMinutes) {
    const slotDate = new Date(y, mo - 1, d, Math.floor(t / 60), t % 60, 0, 0);
    if (slotDate <= now) continue;
    const start = slotDate.toISOString();
    if (bookedStarts.has(start)) continue;
    slots.push({ start, label: formatSlotLabel(slotDate) });
  }

  return slots;
}

export function isValidDateIso(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00`));
}

export function slotLabelFromIso(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function validateNativeConfig(
  native: NativeSchedulingConfig
): NativeSchedulingConfig | null {
  if (!native.enabled) return { ...native, enabled: false, weekly: native.weekly ?? [] };
  const slotMinutes = native.slotMinutes ?? 30;
  if (slotMinutes < 15 || slotMinutes > 120) return null;

  const weekly: DaySlotConfig[] = [];
  for (const row of native.weekly ?? []) {
    if (row.day < 0 || row.day > 6) continue;
    const start = parseHm(row.start);
    const end = parseHm(row.end);
    if (start === null || end === null || end <= start) continue;
    weekly.push({ day: row.day, start: row.start.trim(), end: row.end.trim() });
  }

  const blackoutDates = (native.blackoutDates ?? [])
    .map((d) => d.trim())
    .filter(isValidDateIso);

  return {
    enabled: true,
    slotMinutes,
    weekly,
    blackoutDates: blackoutDates.length ? blackoutDates : undefined,
  };
}
