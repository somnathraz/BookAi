"use client";

import { apiClient } from "@/platform/api/api-client";
import {
  getServerQuerySnapshot,
  setServerQueryData,
  useServerQuery,
} from "@/platform/client-state/server-query-cache";
import { clientQueryKeys } from "@/platform/client-state/query-key-registry";

export type BillingPeriod = "monthly" | "annual";
export type BillingStatus =
  | "created"
  | "authenticated"
  | "active"
  | "cancelled"
  | "halted"
  | "failed";

export interface BillingState {
  readonly plan: "free" | "basic";
  readonly subscriptionId?: string;
  readonly billingPeriod?: BillingPeriod;
  readonly billingStatus?: BillingStatus;
  readonly billingUpdatedAt?: number;
  readonly billingStartedAt?: number;
  readonly billingCurrentStart?: number;
  readonly billingCurrentEnd?: number;
  readonly billingChargeAt?: number;
  readonly billingCancelAtCycleEnd?: boolean;
  readonly billingCancelledAt?: number;
  readonly billingLastReminderAt?: number;
}

export interface BillingSummary {
  readonly email: string;
  readonly plan: "free" | "basic";
  readonly billing: BillingState;
  readonly used: number;
  readonly limit: number;
  readonly activatedAt?: number;
  readonly reminderActive: boolean;
  readonly reminderDays: number;
  readonly dashboardNoticeActive?: boolean;
  readonly dashboardNoticeDays?: number;
}

const billingQueryKey = clientQueryKeys.billing.summary;

export function useBillingQuery() {
  return useServerQuery<BillingSummary>(
    billingQueryKey,
    () => apiClient.get<BillingSummary>("/api/billing"),
    { staleTimeMs: 30_000 }
  );
}

export function replaceCachedBilling(billing: BillingState): void {
  const current = getServerQuerySnapshot<BillingSummary>(billingQueryKey).data;
  if (current) setServerQueryData(billingQueryKey, { ...current, billing });
}
