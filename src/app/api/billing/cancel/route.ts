import { NextResponse } from "next/server";

import { getAccountBilling, setAccountBilling } from "@/lib/accounts";
import { sendBillingCancellationScheduledEmail } from "@/lib/email";
import { billingPatchFromSubscription, cancelSubscriptionAtCycleEnd } from "@/lib/razorpay";
import { emailFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json(
      { error: "Not verified.", code: "verify_required" },
      { status: 401 }
    );
  }

  const billing = await getAccountBilling(email);
  if (!billing.subscriptionId) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 400 });
  }
  if (billing.billingCancelAtCycleEnd) {
    return NextResponse.json({ error: "Cancellation is already scheduled." }, { status: 409 });
  }

  const subscription = await cancelSubscriptionAtCycleEnd(billing.subscriptionId);
  if (!subscription) {
    return NextResponse.json(
      { error: "Razorpay is not configured yet. Check billing env vars." },
      { status: 500 }
    );
  }

  const updated = await setAccountBilling(email, {
    ...billingPatchFromSubscription(subscription, {
      forcePlan: "basic",
      preserveStartedAt: billing.billingStartedAt,
      cancelAtCycleEnd: true,
    }),
    billingStatus: "active",
  });

  try {
    await sendBillingCancellationScheduledEmail(email, {
      endsAt: updated.billingCurrentEnd,
    });
  } catch (error) {
    console.error("Failed to send billing cancellation email", error);
  }

  return NextResponse.json({
    ok: true,
    billing: updated,
  });
}
