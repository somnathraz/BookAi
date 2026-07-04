import type { AccountBilling } from "@/lib/accounts";

export const BILLING_REMINDER_DAYS = 3;
export const DASHBOARD_BILLING_NOTICE_DAYS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export function billingActivatedAt(billing: AccountBilling): number | undefined {
  return billing.billingStartedAt ?? billing.billingCurrentStart ?? billing.billingUpdatedAt;
}

export function reminderWindowStart(
  chargeAt: number,
  days: number = BILLING_REMINDER_DAYS
): number {
  return chargeAt - days * DAY_MS;
}

export function isRenewalReminderWindow(
  chargeAt: number | undefined,
  now: number = Date.now(),
  days: number = BILLING_REMINDER_DAYS
): boolean {
  if (!chargeAt) return false;
  return now >= reminderWindowStart(chargeAt, days) && now < chargeAt;
}

export function isDashboardBillingNoticeWindow(
  chargeAt: number | undefined,
  now: number = Date.now()
): boolean {
  return isRenewalReminderWindow(chargeAt, now, DASHBOARD_BILLING_NOTICE_DAYS);
}

export function shouldSendRenewalReminder(
  billing: AccountBilling,
  now: number = Date.now(),
  days: number = BILLING_REMINDER_DAYS
): boolean {
  if (billing.plan !== "basic") return false;
  if (billing.billingStatus !== "active") return false;
  if (billing.billingCancelAtCycleEnd) return false;
  if (!billing.billingChargeAt) return false;
  if (!isRenewalReminderWindow(billing.billingChargeAt, now, days)) return false;

  const currentCycleStartedAt = billing.billingCurrentStart ?? billing.billingStartedAt ?? 0;
  const lastReminderAt = billing.billingLastReminderAt ?? 0;
  return lastReminderAt < currentCycleStartedAt;
}
