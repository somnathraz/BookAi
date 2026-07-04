import { NextResponse } from "next/server";

import { getPlan } from "@/lib/accounts";
import { getPublishedSiteContext, createBooking, isValidPhone } from "@/lib/booking";
import { bookingEmailAllowed } from "@/lib/booking-plan";
import { sendBookingNotification, sendBookingConfirmation } from "@/lib/email";
import { slotLabelFromIso } from "@/lib/scheduling";
import { ipFromRequest } from "@/lib/abuse";
import { enforceRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";

export const runtime = "nodejs";

interface BookingBody {
  slug?: string;
  name?: string;
  phone?: string;
  email?: string;
  preferredDate?: string;
  preferredTime?: string;
  slotStart?: string;
  service?: string;
  notes?: string;
  /** Honeypot — must be empty. */
  website?: string;
}

export async function POST(request: Request) {
  let body: BookingBody;
  try {
    body = (await request.json()) as BookingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.website?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const slug = body.slug?.trim();
  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const slotStart = body.slotStart?.trim();

  if (!slug || !name || !phone) {
    return NextResponse.json(
      { error: "Name, phone, and site are required." },
      { status: 400 }
    );
  }

  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  if (slotStart && !body.email?.trim()) {
    return NextResponse.json(
      { error: "Email is required to confirm your appointment." },
      { status: 400 }
    );
  }

  if (body.notes && body.notes.length > 2000) {
    return NextResponse.json({ error: "Notes are too long." }, { status: 400 });
  }

  const limited = await enforceRateLimit(request, "booking", {
    extraBuckets: [`slug:${slug}`],
  });
  if (!limited.allowed) return rateLimitResponse(limited);

  const ctx = await getPublishedSiteContext(slug);
  if (!ctx) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const ownerPlan = await getPlan(ctx.ownerEmail);
  if (!bookingEmailAllowed(ownerPlan)) {
    return NextResponse.json({ error: "Booking is not available on this site." }, { status: 403 });
  }

  const result = await createBooking({
    slug,
    visitorName: name,
    visitorPhone: phone,
    visitorEmail: body.email?.trim() || undefined,
    preferredDate: body.preferredDate?.trim() || undefined,
    preferredTime: body.preferredTime?.trim() || undefined,
    slotStart,
    service: body.service?.trim() || undefined,
    notes: body.notes?.trim() || undefined,
    source: slotStart ? "slot" : "form",
    ip: ipFromRequest(request),
  });

  if ("error" in result) {
    if (result.error === "slot_taken") {
      return NextResponse.json(
        { error: "That time was just booked. Please pick another slot." },
        { status: 409 }
      );
    }
    if (result.error === "invalid_slot") {
      return NextResponse.json({ error: "That time is not available." }, { status: 400 });
    }
    if (result.error === "email_required") {
      return NextResponse.json(
        { error: "Email is required to confirm your appointment." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Booking is not enabled for this site." },
      { status: 404 }
    );
  }

  const slotLabel = result.booking.slotStart
    ? slotLabelFromIso(result.booking.slotStart)
    : undefined;

  await sendBookingNotification(result.notifyEmail, result.siteName, {
    visitorName: result.booking.visitorName,
    visitorPhone: result.booking.visitorPhone,
    visitorEmail: result.booking.visitorEmail,
    preferredDate: result.booking.preferredDate,
    preferredTime: slotLabel ?? result.booking.preferredTime,
    service: result.booking.service,
    notes: result.booking.notes,
    slug: result.booking.slug,
  });

  if (result.booking.visitorEmail && result.booking.slotStart) {
    await sendBookingConfirmation(result.booking.visitorEmail, result.siteName, {
      visitorName: result.booking.visitorName,
      slotLabel: slotLabel!,
      service: result.booking.service,
      sitePhone: result.site.identity.phone,
    });
  }

  return NextResponse.json({ ok: true, id: result.booking.id });
}
