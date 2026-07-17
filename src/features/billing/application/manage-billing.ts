import "server-only";

import {
  findEmailBySubscriptionId,
  getAccountBilling,
  listAccountBilling,
  markBillingReminderSent,
  planLimit,
  setAccountBilling,
  siteCount,
} from "@/lib/accounts";
import {
  BILLING_REMINDER_DAYS,
  DASHBOARD_BILLING_NOTICE_DAYS,
  billingActivatedAt,
  isDashboardBillingNoticeWindow,
  isRenewalReminderWindow,
  shouldSendRenewalReminder,
} from "@/lib/billing";
import {
  sendBillingActivatedEmail,
  sendBillingCancellationScheduledEmail,
  sendBillingRenewalReminder,
  sendBillingStoppedEmail,
} from "@/lib/email";
import {
  basicCheckoutDescription,
  billingCyclesForPeriod,
  billingPatchFromSubscription,
  cancelSubscriptionAtCycleEnd,
  fetchSubscription,
  getRazorpayClient,
  getRazorpayKeyId,
  planIdForPeriod,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  type BillingStatus,
  type RazorpaySubscriptionEntity,
} from "@/lib/razorpay";
import { ApiError, apiErrors } from "@/platform/http/api-error";
import { logger } from "@/platform/logging/logger.server";

type RazorpayWebhook = {
  event?: string;
  payload?: { subscription?: { entity?: RazorpaySubscriptionEntity } };
};

function needsBillingBackfill(billing: Awaited<ReturnType<typeof getAccountBilling>>): boolean {
  return Boolean(
    billing.subscriptionId &&
      (!billing.billingPeriod ||
        !billing.billingStartedAt ||
        !billing.billingCurrentEnd ||
        !billing.billingChargeAt)
  );
}

export async function getBillingSummary(email: string) {
  let billing = await getAccountBilling(email);
  if (needsBillingBackfill(billing)) {
    const subscription = await fetchSubscription(billing.subscriptionId!);
    if (subscription) {
      billing = await setAccountBilling(email, {
        ...billingPatchFromSubscription(subscription, {
          preserveStartedAt: billing.billingStartedAt,
        }),
      });
    }
  }

  const [used] = await Promise.all([siteCount(email)]);
  const now = Date.now();
  return {
    email,
    plan: billing.plan,
    billing,
    used,
    limit: planLimit(billing.plan),
    activatedAt: billingActivatedAt(billing),
    reminderActive: isRenewalReminderWindow(billing.billingChargeAt, now),
    reminderDays: BILLING_REMINDER_DAYS,
    dashboardNoticeActive: isDashboardBillingNoticeWindow(billing.billingChargeAt, now),
    dashboardNoticeDays: DASHBOARD_BILLING_NOTICE_DAYS,
  };
}

export async function startBasicCheckout(email: string, period: unknown) {
  if (period !== "monthly" && period !== "annual") {
    throw apiErrors.badRequest("Choose monthly or annual.");
  }
  const current = await getAccountBilling(email);
  if (current.plan === "basic" && current.billingStatus === "active") {
    throw apiErrors.conflict("Your Basic plan is already active.");
  }

  const client = getRazorpayClient();
  const key = getRazorpayKeyId();
  const planId = planIdForPeriod(period);
  if (!client || !key || !planId) {
    throw new ApiError(503, "billing_unavailable", "Billing is not configured.");
  }

  const subscription = await client.subscriptions.create({
    plan_id: planId,
    total_count: billingCyclesForPeriod(period),
    quantity: 1,
    customer_notify: 1,
    notes: {
      email,
      app_plan: "basic",
      billing_period: period,
      product: "paperchai",
    },
  });

  await setAccountBilling(email, {
    ...billingPatchFromSubscription(subscription, {
      preserveStartedAt: current.billingStartedAt,
    }),
    billingPeriod: period,
    billingStatus: "created",
  });

  return {
    key,
    subscriptionId: subscription.id,
    name: "PaperChai",
    description: basicCheckoutDescription(period),
    prefill: { email },
    notes: { app_plan: "basic", billing_period: period },
  };
}

export async function verifyBasicCheckout(
  email: string,
  input: {
    razorpay_payment_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
  }
) {
  const paymentId = input.razorpay_payment_id?.trim();
  const subscriptionId = input.razorpay_subscription_id?.trim();
  const signature = input.razorpay_signature?.trim();
  if (!paymentId || !subscriptionId || !signature) {
    throw apiErrors.badRequest("Missing Razorpay checkout fields.");
  }
  if (!verifyCheckoutSignature({ paymentId, subscriptionId, signature })) {
    throw apiErrors.badRequest("Invalid Razorpay signature.");
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
      : { plan: "basic", subscriptionId, billingStatus: "active" }
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
    } catch {
      logger.warn("billing.activation_email_failed", { operation: "billing.verify" });
    }
  }

  return {
    ok: true,
    plan: billing.plan,
    billingStatus: billing.billingStatus,
    billingPeriod: billing.billingPeriod,
  };
}

export async function cancelBasicSubscription(email: string) {
  const billing = await getAccountBilling(email);
  if (!billing.subscriptionId) throw apiErrors.badRequest("No active subscription found.");
  if (billing.billingCancelAtCycleEnd) {
    throw apiErrors.conflict("Cancellation is already scheduled.");
  }
  const subscription = await cancelSubscriptionAtCycleEnd(billing.subscriptionId);
  if (!subscription) throw new ApiError(503, "billing_unavailable", "Billing is not configured.");

  const updated = await setAccountBilling(email, {
    ...billingPatchFromSubscription(subscription, {
      forcePlan: "basic",
      preserveStartedAt: billing.billingStartedAt,
      cancelAtCycleEnd: true,
    }),
    billingStatus: "active",
  });
  try {
    await sendBillingCancellationScheduledEmail(email, { endsAt: updated.billingCurrentEnd });
  } catch {
    logger.warn("billing.cancellation_email_failed", { operation: "billing.cancel" });
  }
  return updated;
}

export async function processBillingWebhook(raw: string, signature: string | null) {
  if (!verifyWebhookSignature(raw, signature)) {
    throw apiErrors.badRequest("Invalid webhook signature.");
  }
  let body: RazorpayWebhook;
  try {
    body = JSON.parse(raw) as RazorpayWebhook;
  } catch {
    throw apiErrors.badRequest("Invalid webhook JSON.");
  }

  const action = billingActionForEvent(body.event);
  const subscription = body.payload?.subscription?.entity;
  if (!action || !subscription?.id) return { ok: true, ignored: true };
  const email = emailFromSubscription(subscription) ?? (await findEmailBySubscriptionId(subscription.id));
  if (!email) return { ok: true, ignored: true };

  const current = await getAccountBilling(email);
  const basePatch = billingPatchFromSubscription(subscription, {
    forcePlan: action.plan,
    cancelAtCycleEnd: action.cancelAtCycleEnd,
    preserveStartedAt: current.billingStartedAt,
  });
  const updated = await setAccountBilling(email, {
    ...basePatch,
    billingStatus: action.billingStatus ?? basePatch.billingStatus,
  });

  if (
    current.billingStatus !== updated.billingStatus &&
    (updated.billingStatus === "cancelled" || updated.billingStatus === "halted")
  ) {
    try {
      await sendBillingStoppedEmail(email, {
        reason: updated.billingStatus,
        endedAt: updated.billingCancelledAt ?? updated.billingUpdatedAt,
      });
    } catch {
      logger.warn("billing.stopped_email_failed", { operation: "billing.webhook" });
    }
  }
  return { ok: true };
}

export async function sendDueBillingReminders() {
  const now = Date.now();
  const accounts = await listAccountBilling();
  let sent = 0;
  for (const { email, billing } of accounts) {
    if (!shouldSendRenewalReminder(billing, now) || !billing.billingPeriod || !billing.billingChargeAt) {
      continue;
    }
    await sendBillingRenewalReminder(email, {
      period: billing.billingPeriod,
      chargeAt: billing.billingChargeAt,
    });
    await markBillingReminderSent(email, now);
    sent += 1;
  }
  return sent;
}

function emailFromSubscription(subscription: RazorpaySubscriptionEntity): string | null {
  const value = subscription.notes?.email;
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

function billingActionForEvent(event: string | undefined): {
  plan?: "free" | "basic";
  billingStatus?: BillingStatus;
  cancelAtCycleEnd?: boolean;
} | null {
  switch (event) {
    case "subscription.created": return { billingStatus: "created" };
    case "subscription.authenticated": return { billingStatus: "authenticated" };
    case "subscription.activated":
    case "subscription.charged": return { plan: "basic", billingStatus: "active" };
    case "subscription.updated": return {};
    case "subscription.cancelled":
    case "subscription.completed": return { plan: "free", billingStatus: "cancelled", cancelAtCycleEnd: false };
    case "subscription.halted": return { plan: "free", billingStatus: "halted" };
    case "subscription.pending": return { billingStatus: "created" };
    default: return null;
  }
}
