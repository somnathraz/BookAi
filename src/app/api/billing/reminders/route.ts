import { NextResponse } from "next/server";

import {
  listAccountBilling,
  markBillingReminderSent,
} from "@/lib/accounts";
import { shouldSendRenewalReminder } from "@/lib/billing";
import { sendBillingRenewalReminder } from "@/lib/email";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret =
    process.env.BILLING_REMINDER_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function run(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const now = Date.now();
  const accounts = await listAccountBilling();
  let sent = 0;

  for (const { email, billing } of accounts) {
    if (!shouldSendRenewalReminder(billing, now)) continue;
    if (!billing.billingPeriod || !billing.billingChargeAt) continue;

    await sendBillingRenewalReminder(email, {
      period: billing.billingPeriod,
      chargeAt: billing.billingChargeAt,
    });
    await markBillingReminderSent(email, now);
    sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
