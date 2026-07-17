import { NextResponse } from "next/server";

import { requestOtp } from "@/features/authentication/application/request-otp";
import { apiErrors } from "@/platform/http/api-error";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const POST = createApiRoute("auth.request-otp", async (request) => {
  let body: { email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    throw apiErrors.badRequest("Invalid request.");
  }
  const result = await requestOtp(body.email);
  return NextResponse.json({ ok: true, ...result });
});
