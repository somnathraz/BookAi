import "server-only";

import { bookingsToCsv, listBookingsForSite } from "@/lib/booking";

export async function exportOwnedBookings(email: string, siteId: string) {
  const bookings = await listBookingsForSite(email, siteId);
  return bookingsToCsv(bookings);
}
