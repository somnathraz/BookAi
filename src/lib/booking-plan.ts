import type { Plan } from "@/lib/accounts";
import { env } from "@/platform/config/env";

/** Email booking is available on all plans during v2 launch. */
export function bookingEmailAllowed(_plan: Plan): boolean {
  void _plan;
  if (env.bookingAllowFree === "false") return false;
  return true;
}

/** WhatsApp booking — Basic; free when BOOKING_ALLOW_FREE=true. */
export function bookingWhatsAppAllowed(plan: Plan): boolean {
  if (plan === "basic") return true;
  return env.bookingAllowFree === "true";
}

/** External calendar embed (Calendly, Cal.com, etc.) — Basic; free when BOOKING_ALLOW_FREE. */
export function bookingCalendarAllowed(plan: Plan): boolean {
  if (plan === "basic") return true;
  return env.bookingAllowFree !== "false";
}

/** Native slot scheduling — Basic; free when BOOKING_ALLOW_FREE. */
export function bookingNativeAllowed(plan: Plan): boolean {
  if (plan === "basic") return true;
  return env.bookingAllowFree !== "false";
}
