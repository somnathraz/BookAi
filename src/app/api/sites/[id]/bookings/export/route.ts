import { NextResponse } from "next/server";

import { exportOwnedBookings } from "@/features/bookings/application/export-bookings";
import { createApiRouteWithParams } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const GET = createApiRouteWithParams<{ id: string }>(
  "site.booking.export",
  async (_request, context, params) => {
    const csv = await exportOwnedBookings(context.email!, params.id);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bookings-${params.id.slice(0, 8)}.csv"`,
      },
    });
  }
);
