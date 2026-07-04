import { NextResponse } from "next/server";

import { listBookingsForSite, updateBookingStatus } from "@/lib/booking";
import { emailFromRequest } from "@/lib/session";
import type { BookingStatus } from "@/lib/types";

export const runtime = "nodejs";

const STATUSES: BookingStatus[] = ["pending", "contacted", "cancelled", "done"];

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
  return NextResponse.json({ bookings });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ error: "Not verified.", code: "verify_required" }, { status: 401 });
  }

  const { id } = await params;
  let body: { bookingId?: string; status?: BookingStatus };
  try {
    body = (await request.json()) as { bookingId?: string; status?: BookingStatus };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.bookingId || !body.status || !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid booking update." }, { status: 400 });
  }

  const ok = await updateBookingStatus(email, id, body.bookingId, body.status);
  if (!ok) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
