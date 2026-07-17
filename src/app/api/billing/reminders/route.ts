import { NextResponse } from "next/server";

import { sendDueBillingReminders } from "@/features/billing/application/manage-billing";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

async function run() {
  return NextResponse.json({ ok: true, sent: await sendDueBillingReminders() });
}

export const GET = createApiRoute("billing.reminders.read", async () => run());
export const POST = createApiRoute("billing.reminders", async () => run());
