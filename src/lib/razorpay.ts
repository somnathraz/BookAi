import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import Razorpay from "razorpay";

import { PRODUCT_NAME } from "@/lib/brand";

export type BillingPeriod = "monthly" | "annual";
export type BillingStatus =
  | "created"
  | "authenticated"
  | "active"
  | "cancelled"
  | "halted"
  | "failed";

export interface RazorpaySubscriptionEntity {
  id: string;
  plan_id?: string;
  status?: string;
  current_start?: number | null;
  current_end?: number | null;
  charge_at?: number | null;
  start_at?: number | null;
  ended_at?: number | null;
  has_scheduled_changes?: boolean;
  change_scheduled_at?: number | null;
  notes?: Record<string, unknown>;
}

export interface BillingSyncPatch {
  plan?: "free" | "basic";
  subscriptionId?: string | null;
  billingPeriod?: BillingPeriod | null;
  billingStatus?: BillingStatus | null;
  billingStartedAt?: number | null;
  billingCurrentStart?: number | null;
  billingCurrentEnd?: number | null;
  billingChargeAt?: number | null;
  billingCancelAtCycleEnd?: boolean;
  billingCancelledAt?: number | null;
}

export function getRazorpayKeyId(): string | null {
  return process.env.RAZORPAY_API_KEY?.trim() || process.env.RAZORPAY_KEY_ID?.trim() || null;
}

function getRazorpaySecret(): string | null {
  return process.env.RAZORPAY_SECRET?.trim() || process.env.RAZORPAY_KEY_SECRET?.trim() || null;
}

export function razorpayEnabled(): boolean {
  return Boolean(getRazorpayKeyId() && getRazorpaySecret());
}

export function getRazorpayClient(): Razorpay | null {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpaySecret();
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function planIdForPeriod(period: BillingPeriod): string | null {
  if (period === "annual") {
    return process.env.RAZORPAY_PLAN_BASIC_ANNUAL?.trim() || null;
  }
  return process.env.RAZORPAY_PLAN_BASIC_MONTHLY?.trim() || null;
}

export function periodFromPlanId(planId: string | null | undefined): BillingPeriod | null {
  if (!planId) return null;
  if (planId === planIdForPeriod("monthly")) return "monthly";
  if (planId === planIdForPeriod("annual")) return "annual";
  return null;
}

export function billingCyclesForPeriod(period: BillingPeriod): number {
  return period === "monthly" ? 120 : 10;
}

export function basicCheckoutDescription(period: BillingPeriod): string {
  return `${PRODUCT_NAME} Basic — ${period === "annual" ? "Annual" : "Monthly"}`;
}

function secondsToMs(value: number | null | undefined): number | null {
  if (!value) return null;
  return value * 1000;
}

export function subscriptionStatusToBillingStatus(
  status: string | null | undefined
): BillingStatus | undefined {
  switch (status) {
    case "created":
      return "created";
    case "authenticated":
      return "authenticated";
    case "active":
      return "active";
    case "cancelled":
    case "completed":
      return "cancelled";
    case "halted":
      return "halted";
    case "pending":
      return "created";
    default:
      return undefined;
  }
}

export function billingPatchFromSubscription(
  subscription: RazorpaySubscriptionEntity,
  opts?: {
    forcePlan?: "free" | "basic";
    cancelAtCycleEnd?: boolean;
    preserveStartedAt?: number;
  }
): BillingSyncPatch {
  const status = subscriptionStatusToBillingStatus(subscription.status);
  const currentStart = secondsToMs(subscription.current_start);
  const currentEnd = secondsToMs(subscription.current_end);
  const chargeAt = secondsToMs(subscription.charge_at);
  const startedAt =
    opts?.preserveStartedAt ??
    currentStart ??
    secondsToMs(subscription.start_at) ??
    undefined;

  return {
    plan:
      opts?.forcePlan ??
      (status === "cancelled" || status === "halted" ? "free" : "basic"),
    subscriptionId: subscription.id,
    billingPeriod: periodFromPlanId(subscription.plan_id),
    billingStatus: status,
    billingStartedAt: startedAt ?? null,
    billingCurrentStart: currentStart,
    billingCurrentEnd: currentEnd,
    billingChargeAt: chargeAt,
    billingCancelAtCycleEnd: opts?.cancelAtCycleEnd ?? subscription.has_scheduled_changes,
    billingCancelledAt: secondsToMs(subscription.ended_at),
  };
}

export async function fetchSubscription(
  subscriptionId: string
): Promise<RazorpaySubscriptionEntity | null> {
  const client = getRazorpayClient();
  if (!client) return null;
  return (await client.subscriptions.fetch(subscriptionId)) as RazorpaySubscriptionEntity;
}

export async function cancelSubscriptionAtCycleEnd(
  subscriptionId: string
): Promise<RazorpaySubscriptionEntity | null> {
  const client = getRazorpayClient();
  if (!client) return null;
  return (await client.subscriptions.cancel(subscriptionId, true)) as RazorpaySubscriptionEntity;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function verifyCheckoutSignature(input: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
}): boolean {
  const secret = getRazorpaySecret();
  if (!secret) return false;
  const expected = sign(`${input.paymentId}|${input.subscriptionId}`, secret);
  try {
    return (
      expected.length === input.signature.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(input.signature))
    );
  } catch {
    return false;
  }
}

export function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || getRazorpaySecret();
  if (!secret || !signature) return false;
  const expected = sign(payload, secret);
  try {
    return (
      expected.length === signature.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    );
  } catch {
    return false;
  }
}
