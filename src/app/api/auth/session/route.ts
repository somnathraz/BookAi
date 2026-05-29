import { NextResponse } from "next/server";

import { emailFromRequest } from "@/lib/session";

export const runtime = "nodejs";

/** Returns the verified email when the session cookie is still valid. */
export async function GET(request: Request) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ verified: false }, { status: 401 });
  }
  return NextResponse.json({ verified: true, email });
}
