import "server-only";

type SiteBooking = { siteId: string };

const memoryState = globalThis as typeof globalThis & {
  __kritvaniBookings?: SiteBooking[];
};

export function memoryBookings<T extends SiteBooking>(): T[] {
  if (!memoryState.__kritvaniBookings) {
    memoryState.__kritvaniBookings = [];
  }
  return memoryState.__kritvaniBookings as T[];
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
