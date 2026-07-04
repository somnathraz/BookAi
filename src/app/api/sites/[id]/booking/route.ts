import { NextResponse } from "next/server";

import { getSiteById, getPlan } from "@/lib/accounts";
import { patchSiteBooking } from "@/lib/booking";
import {
  bookingWhatsAppAllowed,
  bookingCalendarAllowed,
  bookingNativeAllowed,
} from "@/lib/booking-plan";
import { normalizeCalendarUrl } from "@/lib/calendar-embed";
import { defaultWeeklyAvailability, validateNativeConfig } from "@/lib/scheduling";
import { emailFromRequest } from "@/lib/session";
import type { BookingConfig, NativeSchedulingConfig } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ error: "Not verified.", code: "verify_required" }, { status: 401 });
  }

  const { id } = await params;
  const stored = await getSiteById(email, id);
  if (!stored) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  return NextResponse.json({ booking: stored.site.booking ?? { enabled: false } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ error: "Not verified.", code: "verify_required" }, { status: 401 });
  }

  const { id } = await params;
  let body: Partial<BookingConfig>;
  try {
    body = (await request.json()) as Partial<BookingConfig>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const existing = await getSiteById(email, id);
  if (!existing) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const plan = await getPlan(email);

  let calendarUrl: string | undefined = existing.site.booking?.calendarUrl;
  if (body.calendarUrl !== undefined) {
    const trimmed = body.calendarUrl.trim();
    if (!trimmed) {
      calendarUrl = undefined;
    } else {
      if (!bookingCalendarAllowed(plan)) {
        return NextResponse.json(
          { error: "Calendar scheduling is available on Basic." },
          { status: 403 }
        );
      }
      const normalized = normalizeCalendarUrl(trimmed);
      if (!normalized) {
        return NextResponse.json(
          {
            error:
              "Use a Calendly, Cal.com, Google Calendar, or Outlook scheduling link (https).",
          },
          { status: 400 }
        );
      }
      calendarUrl = normalized;
    }
  }

  let native: NativeSchedulingConfig | undefined = existing.site.booking?.native;
  if (body.native !== undefined) {
    if (!body.native.enabled) {
      native = { enabled: false, weekly: body.native.weekly ?? native?.weekly ?? [] };
    } else {
      if (!bookingNativeAllowed(plan)) {
        return NextResponse.json(
          { error: "Built-in scheduling is available on Basic." },
          { status: 403 }
        );
      }
      const weekly =
        body.native.weekly?.length ? body.native.weekly : native?.weekly?.length
          ? native.weekly
          : defaultWeeklyAvailability();
      const validated = validateNativeConfig({
        ...body.native,
        weekly,
      });
      if (!validated) {
        return NextResponse.json(
          { error: "Check weekly hours and slot length (15–120 min)." },
          { status: 400 }
        );
      }
      native = validated;
    }
  }

  const booking: BookingConfig = {
    enabled: body.enabled ?? existing.site.booking?.enabled ?? false,
    notifyEmail: body.notifyEmail?.trim() || email,
    services: body.services ?? existing.site.booking?.services,
    whatsappNumber: bookingWhatsAppAllowed(plan)
      ? body.whatsappNumber?.trim() || existing.site.booking?.whatsappNumber
      : undefined,
    calendarUrl,
    buttonLabel: body.buttonLabel?.trim() || existing.site.booking?.buttonLabel,
    native,
  };

  const updated = await patchSiteBooking(email, id, booking);
  if (!updated) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  return NextResponse.json({ booking: updated.site.booking, slug: updated.slug });
}
