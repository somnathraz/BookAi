import { NextResponse } from "next/server";

import {
  getOwnedBookingSettings,
  updateOwnedBookingSettings,
} from "@/features/bookings/application/manage-booking-settings";
import { apiErrors } from "@/platform/http/api-error";
import { createApiRouteWithParams } from "@/platform/http/create-api-route";
import type { BookingConfig } from "@/lib/types";

export const runtime = "nodejs";

export const GET = createApiRouteWithParams<{ id: string }>(
  "site.booking-settings.read",
  async (_request, context, { id }) =>
    NextResponse.json({ booking: await getOwnedBookingSettings(context.email!, id) })
);

export const PATCH = createApiRouteWithParams<{ id: string }>(
  "site.booking-settings.update",
  async (request, context, { id }) => {
    let patch: Partial<BookingConfig>;
    try {
      patch = (await request.json()) as Partial<BookingConfig>;
    } catch {
      throw apiErrors.badRequest("Invalid JSON body.");
    }
    return NextResponse.json(
      await updateOwnedBookingSettings({ email: context.email!, siteId: id, patch })
    );
  }
);
