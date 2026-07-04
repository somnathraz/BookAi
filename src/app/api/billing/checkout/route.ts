import { NextResponse } from "next/server";

import { getAccountBilling, setAccountBilling } from "@/lib/accounts";
import {
  basicCheckoutDescription,
  billingPatchFromSubscription,
  billingCyclesForPeriod,
  getRazorpayClient,
  getRazorpayKeyId,
  planIdForPeriod,
  type BillingPeriod,
} from "@/lib/razorpay";
import { emailFromRequest } from "@/lib/session";

export const runtime = "nodejs";

type CheckoutBody = {
  period?: BillingPeriod;
};

export async function POST(request: Request) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json(
      { error: "Verify your email before upgrading.", code: "verify_required" },
      { status: 401 }
    );
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.period !== "monthly" && body.period !== "annual") {
    return NextResponse.json({ error: "Choose monthly or annual." }, { status: 400 });
  }

  const current = await getAccountBilling(email);
  if (current.plan === "basic" && current.billingStatus === "active") {
    return NextResponse.json({ error: "Your Basic plan is already active." }, { status: 409 });
  }

  const client = getRazorpayClient();
  const key = getRazorpayKeyId();
  const planId = planIdForPeriod(body.period);
  if (!client || !key || !planId) {
    return NextResponse.json(
      { error: "Razorpay is not configured yet. Check billing env vars." },
      { status: 500 }
    );
  }

  const subscription = await client.subscriptions.create({
    plan_id: planId,
    total_count: billingCyclesForPeriod(body.period),
    quantity: 1,
    customer_notify: 1,
    notes: {
      email,
      app_plan: "basic",
      billing_period: body.period,
      product: "paperchai",
    },
  });

  await setAccountBilling(email, {
    ...billingPatchFromSubscription(subscription, {
      preserveStartedAt: current.billingStartedAt,
    }),
    billingPeriod: body.period,
    billingStatus: "created",
  });

  return NextResponse.json({
    key,
    subscriptionId: subscription.id,
    name: "PaperChai",
    description: basicCheckoutDescription(body.period),
    prefill: { email },
    notes: {
      app_plan: "basic",
      billing_period: body.period,
    },
  });
}
