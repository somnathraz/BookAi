import { NextResponse } from "next/server";

import { listBookingsForSite, bookingsToCsv } from "@/lib/booking";
import { emailFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ error: "Not verified.", code: "verify_required" }, { status: 401 });
  }

  const { id } = await params;
  const bookings = await listBookingsForSite(email, id);
  const csv = bookingsToCsv(bookings);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-${id.slice(0, 8)}.csv"`,
    },
  });
}
