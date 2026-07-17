import "server-only";

import { getPlan, getSiteById } from "@/lib/accounts";
import { patchSiteBooking } from "@/lib/booking";
import {
  bookingCalendarAllowed,
  bookingNativeAllowed,
  bookingWhatsAppAllowed,
} from "@/lib/booking-plan";
import { normalizeCalendarUrl } from "@/lib/calendar-embed";
import { defaultWeeklyAvailability, validateNativeConfig } from "@/lib/scheduling";
import type { BookingConfig, NativeSchedulingConfig } from "@/lib/types";
import { apiErrors, ApiError } from "@/platform/http/api-error";

export async function getOwnedBookingSettings(email: string, siteId: string) {
  const stored = await getSiteById(email, siteId);
  if (!stored) throw new ApiError(404, "site_not_found", "Site not found.");
  return stored.site.booking ?? { enabled: false };
}

export async function updateOwnedBookingSettings(input: {
  email: string;
  siteId: string;
  patch: Partial<BookingConfig>;
}) {
  const existing = await getSiteById(input.email, input.siteId);
  if (!existing) throw new ApiError(404, "site_not_found", "Site not found.");
  const plan = await getPlan(input.email);
  const { patch } = input;

  let calendarUrl: string | undefined = existing.site.booking?.calendarUrl;
  if (patch.calendarUrl !== undefined) {
    const trimmed = patch.calendarUrl.trim();
    if (!trimmed) calendarUrl = undefined;
    else {
      if (!bookingCalendarAllowed(plan)) {
        throw apiErrors.forbidden("Calendar scheduling is available on Basic.");
      }
      const normalized = normalizeCalendarUrl(trimmed);
      if (!normalized) {
        throw apiErrors.badRequest(
          "Use a Calendly, Cal.com, Google Calendar, or Outlook scheduling link (https)."
        );
      }
      calendarUrl = normalized;
    }
  }

  let native: NativeSchedulingConfig | undefined = existing.site.booking?.native;
  if (patch.native !== undefined) {
    if (!patch.native.enabled) {
      native = { enabled: false, weekly: patch.native.weekly ?? native?.weekly ?? [] };
    } else {
      if (!bookingNativeAllowed(plan)) {
        throw apiErrors.forbidden("Built-in scheduling is available on Basic.");
      }
      const weekly =
        patch.native.weekly?.length ? patch.native.weekly : native?.weekly?.length
          ? native.weekly
          : defaultWeeklyAvailability();
      const validated = validateNativeConfig({ ...patch.native, weekly });
      if (!validated) throw apiErrors.badRequest("Check weekly hours and slot length (15–120 min).");
      native = validated;
    }
  }

  const booking: BookingConfig = {
    enabled: patch.enabled ?? existing.site.booking?.enabled ?? false,
    notifyEmail: patch.notifyEmail?.trim() || input.email,
    services: patch.services ?? existing.site.booking?.services,
    whatsappNumber: bookingWhatsAppAllowed(plan)
      ? patch.whatsappNumber?.trim() || existing.site.booking?.whatsappNumber
      : undefined,
    calendarUrl,
    buttonLabel: patch.buttonLabel?.trim() || existing.site.booking?.buttonLabel,
    native,
  };
  const updated = await patchSiteBooking(input.email, input.siteId, booking);
  if (!updated) throw new ApiError(404, "site_not_found", "Site not found.");
  return { booking: updated.site.booking, slug: updated.slug };
}
