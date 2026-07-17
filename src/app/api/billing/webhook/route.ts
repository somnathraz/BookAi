import { NextResponse } from "next/server";

import { processBillingWebhook } from "@/features/billing/application/manage-billing";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const POST = createApiRoute("billing.webhook", async (request) => {
  const raw = await request.text();
  return NextResponse.json(await processBillingWebhook(raw, request.headers.get("x-razorpay-signature")));
});
