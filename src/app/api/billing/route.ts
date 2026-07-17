import { NextResponse } from "next/server";

import { getBillingSummary } from "@/features/billing/application/manage-billing";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const GET = createApiRoute("billing.summary", async (_request, context) =>
  NextResponse.json(await getBillingSummary(context.email!))
);
