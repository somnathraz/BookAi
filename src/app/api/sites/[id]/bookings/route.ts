import { NextResponse } from "next/server";

import {
  listOwnedBookings,
  updateOwnedBookingStatus,
} from "@/features/bookings/application/manage-bookings";
import { apiErrors } from "@/platform/http/api-error";
import { createApiRouteWithParams } from "@/platform/http/create-api-route";
import type { BookingStatus } from "@/lib/types";

export const runtime = "nodejs";

export const GET = createApiRouteWithParams<{ id: string }>(
  "site.booking.list",
  async (_request, context, { id }) =>
    NextResponse.json({ bookings: await listOwnedBookings(context.email!, id) })
);

export const PATCH = createApiRouteWithParams<{ id: string }>(
  "site.booking.update",
  async (request, context, { id }) => {
    let body: { bookingId?: string; status?: BookingStatus };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw apiErrors.badRequest("Invalid JSON body.");
    }
    await updateOwnedBookingStatus({ email: context.email!, siteId: id, ...body });
    return NextResponse.json({ ok: true });
  }
);
