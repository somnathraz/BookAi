import type { Plan } from "@/lib/accounts";

/** Email booking is available on all plans during v2 launch. */
export function bookingEmailAllowed(_plan: Plan): boolean {
  if (process.env.BOOKING_ALLOW_FREE === "false") return false;
  return true;
}

/** WhatsApp booking — Basic; free when BOOKING_ALLOW_FREE=true. */
export function bookingWhatsAppAllowed(plan: Plan): boolean {
  if (plan === "basic") return true;
  return process.env.BOOKING_ALLOW_FREE === "true";
}

/** External calendar embed (Calendly, Cal.com, etc.) — Basic; free when BOOKING_ALLOW_FREE. */
export function bookingCalendarAllowed(plan: Plan): boolean {
  if (plan === "basic") return true;
  return process.env.BOOKING_ALLOW_FREE !== "false";
}

/** Native slot scheduling — Basic; free when BOOKING_ALLOW_FREE. */
export function bookingNativeAllowed(plan: Plan): boolean {
  if (plan === "basic") return true;
  return process.env.BOOKING_ALLOW_FREE !== "false";
}
