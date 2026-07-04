import { NextResponse } from "next/server";

import { getAccountBilling, planLimit, setAccountBilling, siteCount } from "@/lib/accounts";
import {
  BILLING_REMINDER_DAYS,
  DASHBOARD_BILLING_NOTICE_DAYS,
  billingActivatedAt,
  isDashboardBillingNoticeWindow,
  isRenewalReminderWindow,
} from "@/lib/billing";
import { billingPatchFromSubscription, fetchSubscription } from "@/lib/razorpay";
import { emailFromRequest } from "@/lib/session";

export const runtime = "nodejs";

function needsBillingBackfill(billing: Awaited<ReturnType<typeof getAccountBilling>>): boolean {
  return Boolean(
    billing.subscriptionId &&
      (!billing.billingPeriod ||
        !billing.billingStartedAt ||
        !billing.billingCurrentEnd ||
        !billing.billingChargeAt)
  );
}

export async function GET(request: Request) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json(
      { error: "Not verified.", code: "verify_required" },
      { status: 401 }
    );
  }

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
  const used = await siteCount(email);
  const limit = planLimit(billing.plan);
  const now = Date.now();

  return NextResponse.json({
    email,
    plan: billing.plan,
    billing,
    used,
    limit,
    activatedAt: billingActivatedAt(billing),
    reminderActive: isRenewalReminderWindow(billing.billingChargeAt, now),
    reminderDays: BILLING_REMINDER_DAYS,
    dashboardNoticeActive: isDashboardBillingNoticeWindow(billing.billingChargeAt, now),
    dashboardNoticeDays: DASHBOARD_BILLING_NOTICE_DAYS,
  });
}
