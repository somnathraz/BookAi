import "server-only";

import { listBookingsForSite, updateBookingStatus } from "@/lib/booking";
import type { BookingStatus } from "@/lib/types";
import { apiErrors, ApiError } from "@/platform/http/api-error";

const bookingStatuses: BookingStatus[] = ["pending", "contacted", "cancelled", "done"];

export async function listOwnedBookings(email: string, siteId: string) {
  return listBookingsForSite(email, siteId);
}

export async function updateOwnedBookingStatus(input: {
  email: string;
  siteId: string;
  bookingId?: string;
  status?: BookingStatus;
}): Promise<void> {
  if (!input.bookingId || !input.status || !bookingStatuses.includes(input.status)) {
    throw apiErrors.badRequest("Invalid booking update.");
  }
  const updated = await updateBookingStatus(
    input.email,
    input.siteId,
    input.bookingId,
    input.status
  );
  if (!updated) throw new ApiError(404, "booking_not_found", "Booking not found.");
}

