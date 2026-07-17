import { NextResponse } from "next/server";

import { maybeSendWelcomeEmail } from "@/lib/lifecycle";
import { setSessionCookie } from "@/lib/session-cookie";
import { verifyOtpCode } from "@/features/authentication/application/verify-otp";
import { apiErrors } from "@/platform/http/api-error";
import { createApiRoute } from "@/platform/http/create-api-route";
import { logger } from "@/platform/logging/logger.server";

export const runtime = "nodejs";

export const POST = createApiRoute("auth.verify-otp", async (request) => {
  let body: { email?: string; code?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    throw apiErrors.badRequest("Invalid request.");
  }

  const result = await verifyOtpCode(body);
  const response = NextResponse.json({ ok: true });
  setSessionCookie(response, result.sessionToken);
  void maybeSendWelcomeEmail(result.email).catch(() => {
    logger.warn("authentication.welcome-email.failed");
  });
  return response;
});
