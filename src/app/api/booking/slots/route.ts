import { NextResponse } from "next/server";

import { getPublishedSiteContext, listBookedSlotStarts } from "@/lib/booking";
import { bookingNativeAllowed } from "@/lib/booking-plan";
import { getPlan } from "@/lib/accounts";
import { generateSlotsForDate, isValidDateIso } from "@/lib/scheduling";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim();
  const date = url.searchParams.get("date")?.trim();

  if (!slug || !date) {
    return NextResponse.json({ error: "slug and date are required." }, { status: 400 });
  }
  if (!isValidDateIso(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  const ctx = await getPublishedSiteContext(slug);
  if (!ctx) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const native = ctx.stored.site.booking?.native;
  if (!native?.enabled) {
    return NextResponse.json({ error: "Scheduling is not enabled." }, { status: 404 });
  }

  const ownerPlan = await getPlan(ctx.ownerEmail);
  if (!bookingNativeAllowed(ownerPlan)) {
    return NextResponse.json({ error: "Scheduling is not available." }, { status: 403 });
  }

  const booked = await listBookedSlotStarts(ctx.stored.id, date);
  const slots = generateSlotsForDate(ctx.stored.site, native, date, booked);

  return NextResponse.json({ slots, slotMinutes: native.slotMinutes ?? 30 });
}
