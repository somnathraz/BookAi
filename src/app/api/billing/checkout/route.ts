import { NextResponse } from "next/server";

import { startBasicCheckout } from "@/features/billing/application/manage-billing";
import { apiErrors } from "@/platform/http/api-error";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const POST = createApiRoute("billing.checkout", async (request, context) => {
  let body: { period?: unknown };
  try {
    body = (await request.json()) as { period?: unknown };
  } catch {
    throw apiErrors.badRequest("Invalid JSON body.");
  }
  return NextResponse.json(await startBasicCheckout(context.email!, body.period));
});
