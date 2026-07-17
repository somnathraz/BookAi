import { NextResponse } from "next/server";

import { listPublicBookingSlots } from "@/features/bookings/application/public-booking";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const GET = createApiRoute("public-booking.slots", async (request) => {
  const url = new URL(request.url);
  return NextResponse.json(
    await listPublicBookingSlots({
      slug: url.searchParams.get("slug") ?? undefined,
      date: url.searchParams.get("date") ?? undefined,
    })
  );
});
