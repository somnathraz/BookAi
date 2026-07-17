import { NextResponse } from "next/server";

import { sendDueUpgradeNudges } from "@/lib/lifecycle";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

async function run() {
  const sent = await sendDueUpgradeNudges();
  return NextResponse.json({ ok: true, sent });
}

export const GET = createApiRoute("lifecycle.reminders.read", async () => run());
export const POST = createApiRoute("lifecycle.reminders", async () => run());
