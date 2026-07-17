import { NextResponse } from "next/server";

import { sendDueUpgradeNudges } from "@/lib/lifecycle";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret =
    process.env.LIFECYCLE_EMAIL_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function run(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const sent = await sendDueUpgradeNudges();
  return NextResponse.json({ ok: true, sent });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
