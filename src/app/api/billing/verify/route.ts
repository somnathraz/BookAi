import { NextResponse } from "next/server";

import { verifyBasicCheckout } from "@/features/billing/application/manage-billing";
import { apiErrors } from "@/platform/http/api-error";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const POST = createApiRoute("billing.verify", async (request, context) => {
  let body: Parameters<typeof verifyBasicCheckout>[1];
  try {
    body = (await request.json()) as Parameters<typeof verifyBasicCheckout>[1];
  } catch {
    throw apiErrors.badRequest("Invalid JSON body.");
  }
  return NextResponse.json(await verifyBasicCheckout(context.email!, body));
});
