import { NextResponse } from "next/server";

import { hasEmailTransport, sendOtp } from "@/lib/email";
import { createOtp, isValidEmail, normalizeEmail } from "@/lib/otp";
import { enforceRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let email = "";
  try {
    ({ email } = (await request.json()) as { email: string });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  email = normalizeEmail(email ?? "");
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const limited = await enforceRateLimit(request, "otp", { emailOverride: email });
  if (!limited.allowed) return rateLimitResponse(limited);

  const code = await createOtp(email);
  if (!code) {
    return NextResponse.json(
      { error: "A code was just sent — check your inbox or wait a moment." },
      { status: 429 }
    );
  }

  try {
    await sendOtp(email, code); // emails it, or logs it in dev when no transport
  } catch {
    return NextResponse.json({ error: "Couldn't send the email. Try again." }, { status: 502 });
  }

  const delivered = hasEmailTransport();
  // Surface the code in dev when there's no real transport, so the gate is testable.
  const devCode =
    !delivered && process.env.NODE_ENV !== "production" ? code : undefined;

  return NextResponse.json({ ok: true, delivered, devCode });
}
