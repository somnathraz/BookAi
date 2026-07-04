import { NextResponse } from "next/server";

import { getAccountBilling, setAccountBilling } from "@/lib/accounts";
import { sendBillingActivatedEmail } from "@/lib/email";
import {
  billingPatchFromSubscription,
  fetchSubscription,
  verifyCheckoutSignature,
} from "@/lib/razorpay";
import { emailFromRequest } from "@/lib/session";

export const runtime = "nodejs";

type VerifyBody = {
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
};

export async function POST(request: Request) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json(
      { error: "Verify your email before upgrading.", code: "verify_required" },
      { status: 401 }
    );
  }

  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const paymentId = body.razorpay_payment_id?.trim();
  const subscriptionId = body.razorpay_subscription_id?.trim();
  const signature = body.razorpay_signature?.trim();

  if (!paymentId || !subscriptionId || !signature) {
    return NextResponse.json({ error: "Missing Razorpay checkout fields." }, { status: 400 });
  }

  if (
    !verifyCheckoutSignature({
      paymentId,
      subscriptionId,
      signature,
    })
  ) {
    return NextResponse.json({ error: "Invalid Razorpay signature." }, { status: 400 });
  }

  const existing = await getAccountBilling(email);
  const subscription = await fetchSubscription(subscriptionId);

  const billing = await setAccountBilling(
    email,
    subscription
      ? billingPatchFromSubscription(subscription, {
          forcePlan: "basic",
          preserveStartedAt: existing.billingStartedAt,
        })
      : {
          plan: "basic",
          subscriptionId,
          billingStatus: "active",
        }
  );

  const shouldSendActivationEmail =
    (existing.plan !== "basic" || existing.subscriptionId !== subscriptionId) &&
    billing.plan === "basic" &&
    billing.billingPeriod;
  if (shouldSendActivationEmail) {
    try {
      await sendBillingActivatedEmail(email, {
        period: billing.billingPeriod!,
        chargeAt: billing.billingChargeAt,
      });
    } catch (error) {
      console.error("Failed to send billing activation email", error);
    }
  }

  return NextResponse.json({
    ok: true,
    plan: billing.plan,
    billingStatus: billing.billingStatus,
    billingPeriod: billing.billingPeriod,
  });
}
