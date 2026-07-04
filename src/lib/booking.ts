import "server-only";

import { randomUUID } from "crypto";

import { ensureSchema, getSql } from "@/lib/db";
import { getSiteBySlug, getSiteById, getSiteOwnerEmail, updateSite, type StoredSite } from "@/lib/accounts";
import type { BookingConfig, BookingStatus, SiteData } from "@/lib/types";
import { syncBookingSection } from "@/lib/booking-defaults";
import {
  generateSlotsForDate,
  isValidDateIso,
  slotLabelFromIso,
} from "@/lib/scheduling";

export interface BookingRecord {
  id: string;
  siteId: string;
  slug: string;
  status: BookingStatus;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
  preferredDate?: string;
  preferredTime?: string;
  slotStart?: string;
  service?: string;
  notes?: string;
  source: "form" | "whatsapp" | "slot";
  createdAt: number;
}

export interface PublishedSiteContext {
  stored: StoredSite;
  ownerEmail: string;
}

type BookingRow = {
  id: string;
  site_id: string;
  slug: string;
  status: BookingStatus;
  visitor_name: string;
  visitor_phone: string;
  visitor_email: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  service: string | null;
  notes: string | null;
  source: string;
  slot_start: Date | null;
  created_at: Date;
};

function parseSource(source: string): BookingRecord["source"] {
  if (source === "whatsapp") return "whatsapp";
  if (source === "slot") return "slot";
  return "form";
}

function rowToBooking(r: BookingRow): BookingRecord {
  return {
    id: r.id,
    siteId: r.site_id,
    slug: r.slug,
    status: r.status,
    visitorName: r.visitor_name,
    visitorPhone: r.visitor_phone,
    visitorEmail: r.visitor_email ?? undefined,
    preferredDate: r.preferred_date ?? undefined,
    preferredTime: r.preferred_time ?? undefined,
    slotStart: r.slot_start ? new Date(r.slot_start).toISOString() : undefined,
    service: r.service ?? undefined,
    notes: r.notes ?? undefined,
    source: parseSource(r.source),
    createdAt: new Date(r.created_at).getTime(),
  };
}

const memBookings: BookingRecord[] = [];

export async function getPublishedSiteContext(
  slug: string
): Promise<PublishedSiteContext | null> {
  const stored = await getSiteBySlug(slug);
  if (!stored) return null;
  const ownerEmail = (await getSiteOwnerEmail(stored.id)) ?? "";
  return { stored, ownerEmail };
}

export interface CreateBookingInput {
  slug: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
  preferredDate?: string;
  preferredTime?: string;
  slotStart?: string;
  service?: string;
  notes?: string;
  source?: "form" | "whatsapp" | "slot";
  ip?: string;
}

export async function listBookedSlotStarts(
  siteId: string,
  dateIso: string
): Promise<Set<string>> {
  const sql = getSql();
  const booked = new Set<string>();
  if (!isValidDateIso(dateIso)) return booked;

  if (sql) {
    await ensureSchema();
    const rows = await sql<{ slot_start: Date }[]>`
      select slot_start from bookings
       where site_id = ${siteId}
         and slot_start is not null
         and status not in ('cancelled')
         and slot_start::date = ${dateIso}::date`;
    for (const row of rows) {
      booked.add(new Date(row.slot_start).toISOString());
    }
    return booked;
  }

  for (const b of memBookings) {
    if (b.siteId !== siteId || b.status === "cancelled" || !b.slotStart) continue;
    if (b.slotStart.slice(0, 10) === dateIso) booked.add(b.slotStart);
  }
  return booked;
}

export async function createBooking(
  input: CreateBookingInput
): Promise<
  | { booking: BookingRecord; siteName: string; notifyEmail: string; site: SiteData }
  | { error: "not_found" | "slot_taken" | "invalid_slot" | "email_required" }
> {
  const ctx = await getPublishedSiteContext(input.slug);
  if (!ctx?.stored.site.booking?.enabled) return { error: "not_found" };

  const notifyEmail =
    ctx.stored.site.booking.notifyEmail?.trim() ||
    ctx.ownerEmail ||
    ctx.stored.site.identity.email?.trim();
  if (!notifyEmail) return { error: "not_found" };

  let slotStart: string | undefined;
  let preferredDate = input.preferredDate;
  let preferredTime = input.preferredTime;
  const source = input.source ?? "form";

  if (input.slotStart) {
    const native = ctx.stored.site.booking.native;
    if (!native?.enabled) return { error: "invalid_slot" };
    if (!input.visitorEmail?.trim()) return { error: "email_required" };

    const dateIso = input.slotStart.slice(0, 10);
    if (!isValidDateIso(dateIso)) return { error: "invalid_slot" };

    const booked = await listBookedSlotStarts(ctx.stored.id, dateIso);
    const slots = generateSlotsForDate(ctx.stored.site, native, dateIso, booked);
    const match = slots.find((s) => s.start === input.slotStart);
    if (!match) return { error: "invalid_slot" };

    slotStart = match.start;
    preferredDate = dateIso;
    preferredTime = match.label;
  }

  const id = randomUUID();
  const record: BookingRecord = {
    id,
    siteId: ctx.stored.id,
    slug: ctx.stored.slug,
    status: "pending",
    visitorName: input.visitorName,
    visitorPhone: input.visitorPhone,
    visitorEmail: input.visitorEmail,
    preferredDate,
    preferredTime,
    slotStart,
    service: input.service,
    notes: input.notes,
    source: slotStart ? "slot" : source,
    createdAt: Date.now(),
  };

  const sql = getSql();
  if (sql) {
    await ensureSchema();
    try {
      await sql`
        insert into bookings (
          id, site_id, slug, status, visitor_name, visitor_phone, visitor_email,
          preferred_date, preferred_time, service, notes, source, slot_start, ip, created_at
        ) values (
          ${id}, ${ctx.stored.id}, ${ctx.stored.slug}, ${record.status},
          ${record.visitorName}, ${record.visitorPhone}, ${record.visitorEmail ?? null},
          ${preferredDate ?? null}, ${preferredTime ?? null},
          ${record.service ?? null}, ${record.notes ?? null},
          ${record.source}, ${slotStart ?? null}, ${input.ip ?? null},
          to_timestamp(${record.createdAt} / 1000.0)
        )`;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "23505") return { error: "slot_taken" };
      throw err;
    }
  } else {
    if (slotStart) {
      const clash = memBookings.some(
        (b) =>
          b.siteId === ctx.stored.id &&
          b.slotStart === slotStart &&
          b.status !== "cancelled"
      );
      if (clash) return { error: "slot_taken" };
    }
    memBookings.unshift(record);
  }

  return {
    booking: record,
    siteName: ctx.stored.site.identity.name,
    notifyEmail,
    site: ctx.stored.site,
  };
}

export async function listBookingsForSite(
  email: string,
  siteId: string
): Promise<BookingRecord[]> {
  const owned = await getSiteById(email, siteId);
  if (!owned) return [];

  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<BookingRow[]>`
      select id, site_id, slug, status, visitor_name, visitor_phone, visitor_email,
             preferred_date::text, preferred_time, service, notes, source, slot_start, created_at
        from bookings where site_id = ${siteId}
        order by created_at desc limit 100`;
    return rows.map(rowToBooking);
  }
  return memBookings.filter((b) => b.siteId === siteId);
}

export async function updateBookingStatus(
  email: string,
  siteId: string,
  bookingId: string,
  status: BookingStatus
): Promise<boolean> {
  const owned = await getSiteById(email, siteId);
  if (!owned) return false;

  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const res = await sql`
      update bookings set status = ${status}
       where id = ${bookingId} and site_id = ${siteId}`;
    return res.count > 0;
  }
  const b = memBookings.find((x) => x.id === bookingId && x.siteId === siteId);
  if (!b) return false;
  b.status = status;
  return true;
}

export async function patchSiteBooking(
  email: string,
  siteId: string,
  booking: BookingConfig
): Promise<StoredSite | null> {
  const existing = await getSiteById(email, siteId);
  if (!existing) return null;

  let site: SiteData = { ...existing.site, booking };
  site = syncBookingSection(site);
  return updateSite(email, siteId, site);
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function bookingSlotLabel(booking: BookingRecord): string | undefined {
  if (booking.slotStart) return slotLabelFromIso(booking.slotStart);
  if (booking.preferredDate || booking.preferredTime) {
    return [booking.preferredDate, booking.preferredTime].filter(Boolean).join(" · ");
  }
  return undefined;
}

export function bookingsToCsv(rows: BookingRecord[]): string {
  const header = [
    "id",
    "created_at",
    "status",
    "source",
    "visitor_name",
    "visitor_phone",
    "visitor_email",
    "slot_or_preferred",
    "service",
    "notes",
  ];
  const lines = rows.map((b) => {
    const slot = bookingSlotLabel(b) ?? "";
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    return [
      b.id,
      new Date(b.createdAt).toISOString(),
      b.status,
      b.source,
      esc(b.visitorName),
      esc(b.visitorPhone),
      esc(b.visitorEmail ?? ""),
      esc(slot),
      esc(b.service ?? ""),
      esc(b.notes ?? ""),
    ].join(",");
  });
  return [header.join(","), ...lines].join("\n");
}
