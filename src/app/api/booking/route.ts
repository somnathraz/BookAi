import { NextResponse } from "next/server";

import { ipFromRequest } from "@/lib/abuse";
import { createPublicBooking, type PublicBookingInput } from "@/features/bookings/application/public-booking";
import { apiErrors } from "@/platform/http/api-error";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const POST = createApiRoute("site.booking", async (request) => {
  let body: PublicBookingInput;
  try {
    body = (await request.json()) as PublicBookingInput;
  } catch {
    throw apiErrors.badRequest("Invalid JSON body.");
  }
  const result = await createPublicBooking({ ...body, ip: ipFromRequest(request) });
  return NextResponse.json({ ok: true, ...result });
});
