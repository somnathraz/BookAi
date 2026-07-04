import { NextResponse } from "next/server";

import { findEmailBySubscriptionId, getAccountBilling, setAccountBilling } from "@/lib/accounts";
import { sendBillingStoppedEmail } from "@/lib/email";
import {
  billingPatchFromSubscription,
  verifyWebhookSignature,
  type BillingStatus,
  type RazorpaySubscriptionEntity,
} from "@/lib/razorpay";

export const runtime = "nodejs";

type RazorpayWebhook = {
  event?: string;
  payload?: {
    subscription?: {
      entity?: RazorpaySubscriptionEntity;
    };
  };
};

function extractSubscription(body: RazorpayWebhook): RazorpaySubscriptionEntity | null {
  return body.payload?.subscription?.entity ?? null;
}

function emailFromNotes(notes: Record<string, unknown> | undefined): string | null {
  const raw = notes?.email;
  return typeof raw === "string" && raw.trim() ? raw.trim().toLowerCase() : null;
}

function statusFromEvent(event: string | undefined): {
  plan?: "free" | "basic";
  billingStatus?: BillingStatus;
  cancelAtCycleEnd?: boolean;
} | null {
  switch (event) {
    case "subscription.created":
      return { billingStatus: "created" };
    case "subscription.authenticated":
      return { billingStatus: "authenticated" };
    case "subscription.activated":
    case "subscription.charged":
      return { plan: "basic", billingStatus: "active" };
    case "subscription.updated":
      return {};
    case "subscription.cancelled":
    case "subscription.completed":
      return { plan: "free", billingStatus: "cancelled", cancelAtCycleEnd: false };
    case "subscription.halted":
      return { plan: "free", billingStatus: "halted" };
    case "subscription.pending":
      return { billingStatus: "created" };
    default:
      return null;
  }
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let body: RazorpayWebhook;
  try {
    body = JSON.parse(raw) as RazorpayWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid webhook JSON." }, { status: 400 });
  }

  const action = statusFromEvent(body.event);
  if (!action) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const subscription = extractSubscription(body);
  if (!subscription?.id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const email =
    emailFromNotes(subscription.notes) ||
    (await findEmailBySubscriptionId(subscription.id));
  if (!email) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const current = await getAccountBilling(email);
  const basePatch = billingPatchFromSubscription(subscription, {
    forcePlan: action.plan,
    cancelAtCycleEnd: action.cancelAtCycleEnd,
    preserveStartedAt: current.billingStartedAt,
  });
  const nextStatus =
    action.billingStatus !== undefined ? action.billingStatus : basePatch.billingStatus;
  const updated = await setAccountBilling(email, {
    ...basePatch,
    billingStatus: nextStatus,
  });

  const statusChanged = current.billingStatus !== updated.billingStatus;
  if (statusChanged && (updated.billingStatus === "cancelled" || updated.billingStatus === "halted")) {
    try {
      await sendBillingStoppedEmail(email, {
        reason: updated.billingStatus,
        endedAt: updated.billingCancelledAt ?? updated.billingUpdatedAt,
      });
    } catch (error) {
      console.error("Failed to send billing stopped email", error);
    }
  }

  return NextResponse.json({ ok: true });
}
