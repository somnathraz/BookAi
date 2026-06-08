import { NextResponse } from "next/server";

import { isValidEmail, normalizeEmail, verifyOtp } from "@/lib/otp";
import { enforceRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { makeToken } from "@/lib/session";
import { setSessionCookie } from "@/lib/session-cookie";

export const runtime = "nodejs";

const MESSAGES: Record<string, string> = {
  invalid: "That code isn't right. Try again.",
  expired: "That code expired. Request a new one.",
  too_many: "Too many attempts. Request a new code.",
};

export async function POST(request: Request) {
  let email = "";
  let code = "";
  try {
    ({ email, code } = (await request.json()) as { email: string; code: string });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  email = normalizeEmail(email ?? "");
  if (!isValidEmail(email) || !code?.trim()) {
    return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  }

  const limited = await enforceRateLimit(request, "auth", email);
  if (!limited.allowed) return rateLimitResponse(limited);

  const result = await verifyOtp(email, code);
  if (result !== "ok") {
    return NextResponse.json({ error: MESSAGES[result] ?? "Verification failed." }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, makeToken(email));
  return res;
}
