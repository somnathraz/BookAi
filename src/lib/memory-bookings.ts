import "server-only";

type SiteBooking = { siteId: string };

const memoryState = globalThis as typeof globalThis & {
  __paperchaiBookings?: SiteBooking[];
};

export function memoryBookings<T extends SiteBooking>(): T[] {
  if (!memoryState.__paperchaiBookings) {
    memoryState.__paperchaiBookings = [];
  }
  return memoryState.__paperchaiBookings as T[];
}

export function deleteMemoryBookingsForSite(siteId: string): number {
  const bookings = memoryBookings();
  let deleted = 0;
  for (let index = bookings.length - 1; index >= 0; index -= 1) {
    if (bookings[index].siteId === siteId) {
      bookings.splice(index, 1);
      deleted += 1;
    }
  }
  return deleted;
}
