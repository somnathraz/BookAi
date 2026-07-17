import "server-only";

import { getPlan } from "@/lib/accounts";
import {
  createBooking,
  getPublishedSiteContext,
  isValidPhone,
  listBookedSlotStarts,
} from "@/lib/booking";
import { bookingEmailAllowed, bookingNativeAllowed } from "@/lib/booking-plan";
import { sendBookingConfirmation, sendBookingNotification } from "@/lib/email";
import { generateSlotsForDate, isValidDateIso, slotLabelFromIso } from "@/lib/scheduling";
import { apiErrors, ApiError } from "@/platform/http/api-error";
import { logger } from "@/platform/logging/logger.server";

export interface PublicBookingInput {
  slug?: string;
  name?: string;
  phone?: string;
  email?: string;
  preferredDate?: string;
  preferredTime?: string;
  slotStart?: string;
  service?: string;
  notes?: string;
  website?: string;
  ip?: string;
}

export async function createPublicBooking(input: PublicBookingInput): Promise<{ id?: string }> {
  // Honeypot responses deliberately look successful to bots.
  if (input.website?.trim()) return {};

  const slug = input.slug?.trim();
  const name = input.name?.trim();
  const phone = input.phone?.trim();
  const slotStart = input.slotStart?.trim();
  if (!slug || !name || !phone) {
    throw apiErrors.badRequest("Name, phone, and site are required.");
  }
  if (!isValidPhone(phone)) throw apiErrors.badRequest("Enter a valid phone number.");
  if (slotStart && !input.email?.trim()) {
    throw apiErrors.badRequest("Email is required to confirm your appointment.");
  }
  if (input.notes && input.notes.length > 2000) throw apiErrors.badRequest("Notes are too long.");

  const context = await getPublishedSiteContext(slug);
  if (!context) throw new ApiError(404, "site_not_found", "Site not found.");
  if (!bookingEmailAllowed(await getPlan(context.ownerEmail))) {
    throw apiErrors.forbidden("Booking is not available on this site.");
  }

  const result = await createBooking({
    slug,
    visitorName: name,
    visitorPhone: phone,
    visitorEmail: input.email?.trim() || undefined,
    preferredDate: input.preferredDate?.trim() || undefined,
    preferredTime: input.preferredTime?.trim() || undefined,
    slotStart,
    service: input.service?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    source: slotStart ? "slot" : "form",
    ip: input.ip,
  });
  if ("error" in result) throw bookingError(result.error);

  const slotLabel = result.booking.slotStart ? slotLabelFromIso(result.booking.slotStart) : undefined;
  void notifyBooking(result, slotLabel);
  return { id: result.booking.id };
}

export async function listPublicBookingSlots(input: { slug?: string; date?: string }) {
  const slug = input.slug?.trim();
  const date = input.date?.trim();
  if (!slug || !date) throw apiErrors.badRequest("slug and date are required.");
  if (!isValidDateIso(date)) throw apiErrors.badRequest("Invalid date.");

  const context = await getPublishedSiteContext(slug);
  if (!context) throw new ApiError(404, "site_not_found", "Site not found.");
  const native = context.stored.site.booking?.native;
  if (!native?.enabled) throw new ApiError(404, "scheduling_unavailable", "Scheduling is not enabled.");
  if (!bookingNativeAllowed(await getPlan(context.ownerEmail))) {
    throw apiErrors.forbidden("Scheduling is not available.");
  }
  const booked = await listBookedSlotStarts(context.stored.id, date);
  return {
    slots: generateSlotsForDate(context.stored.site, native, date, booked),
    slotMinutes: native.slotMinutes ?? 30,
  };
}

function bookingError(error: string): ApiError {
  if (error === "slot_taken") {
    return new ApiError(409, "slot_taken", "That time was just booked. Please pick another slot.");
  }
  if (error === "invalid_slot") return apiErrors.badRequest("That time is not available.");
  if (error === "email_required") {
    return apiErrors.badRequest("Email is required to confirm your appointment.");
  }
  return new ApiError(404, "booking_unavailable", "Booking is not enabled for this site.");
}

async function notifyBooking(
  result: Exclude<Awaited<ReturnType<typeof createBooking>>, { error: string }>,
  slotLabel: string | undefined
): Promise<void> {
  try {
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
  } catch {
    logger.warn("booking.notification.failed", { slug: result.booking.slug });
  }
}
