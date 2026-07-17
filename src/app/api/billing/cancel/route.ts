import { NextResponse } from "next/server";

import { cancelBasicSubscription } from "@/features/billing/application/manage-billing";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const POST = createApiRoute("billing.cancel", async (_request, context) =>
  NextResponse.json({ ok: true, billing: await cancelBasicSubscription(context.email!) })
);
