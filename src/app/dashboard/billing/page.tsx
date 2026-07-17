"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { BasicCheckoutButton } from "@/components/billing/BasicCheckoutButton";
import { EmailGate } from "@/components/generator/EmailGate";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiClient } from "@/platform/api/api-client";
import {
  replaceCachedBilling,
  type BillingState,
  type BillingStatus,
  useBillingQuery,
} from "@/features/billing/presentation/billing-query";

function formatDate(value?: number): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value?: number): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function labelForStatus(status?: BillingStatus): string {
  switch (status) {
    case "created":
      return "Checkout started";
    case "authenticated":
      return "Payment authenticated";
    case "active":
      return "Active";
    case "cancelled":
      return "Cancelled";
    case "halted":
      return "Halted";
    case "failed":
      return "Failed";
    default:
      return "Free";
  }
}

function nextPaymentAt(billing: BillingState): number | undefined {
  return billing.billingChargeAt ?? billing.billingCurrentEnd;
}

function currentPeriodEndsAt(billing: BillingState): number | undefined {
  return billing.billingCurrentEnd ?? billing.billingChargeAt;
}

export default function DashboardBillingPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const billingQuery = useBillingQuery();
  const billing = billingQuery.data;
  const loading = billingQuery.status === "idle" || billingQuery.status === "loading";
  const needsVerify = billingQuery.error instanceof ApiClientError && billingQuery.error.status === 401;
  const load = useCallback(() => {
    void billingQuery.refresh().catch(() => undefined);
  }, [billingQuery]);

  async function cancelAtPeriodEnd() {
    setCancelling(true);
    setError(null);
    setMessage(null);
    try {
      const data = await apiClient.post<{ billing?: BillingState }>("/api/billing/cancel");
      if (!data.billing) throw new Error("Could not schedule cancellation.");
      replaceCachedBilling(data.billing);
      setMessage("Cancellation scheduled for the end of your current billing period.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule cancellation.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <MarketingNav />
      <section className="mx-auto w-full max-w-4xl flex-1 px-6 pb-24 pt-12">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to My sites
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View your active plan, renewal schedule, and subscription status.
            </p>
          </div>
          {billing?.email ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">{billing.email}</span>
              <SignOutButton onSignedOut={() => void load()} />
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="mt-12 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading billing…
          </div>
        ) : needsVerify ? (
          <div className="mx-auto mt-12 max-w-md rounded-2xl border bg-card/60 p-6">
            <EmailGate onBack={() => load()} onVerified={() => load()} />
          </div>
        ) : billing ? (
          <div className="space-y-6">
            {billing.reminderActive && billing.billing.plan === "basic" ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                Your Basic plan renews on{" "}
                <strong>{formatDateTime(nextPaymentAt(billing.billing))}</strong>. We&apos;ll
                send a reminder {billing.reminderDays} days before renewal.
              </div>
            ) : null}

            <div className="rounded-2xl border bg-card/60 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="rounded-full capitalize">
                    {billing.plan} plan
                  </Badge>
                  <Badge variant="outline">{labelForStatus(billing.billing.billingStatus)}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {billing.used} / {billing.limit} sites used
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Activated
                  </p>
                  <p className="mt-2 font-medium">
                    {formatDate(billing.activatedAt ?? billing.billing.billingStartedAt)}
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Billing period
                  </p>
                  <p className="mt-2 font-medium capitalize">
                    {billing.billing.billingPeriod ?? "Free"}
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Next payment due
                  </p>
                  <p className="mt-2 font-medium">
                    {formatDateTime(nextPaymentAt(billing.billing))}
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Current period ends
                  </p>
                  <p className="mt-2 font-medium">
                    {formatDateTime(currentPeriodEndsAt(billing.billing))}
                  </p>
                </div>
              </div>

              {billing.billing.billingCancelAtCycleEnd ? (
                <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
                  <p className="font-medium">Cancellation scheduled</p>
                  <p className="mt-1 text-muted-foreground">
                    Your Basic plan will remain active until{" "}
                    <strong>{formatDateTime(currentPeriodEndsAt(billing.billing))}</strong>, then your
                    account will move to Free.
                  </p>
                </div>
              ) : null}

              {billing.plan === "basic" && billing.billing.subscriptionId ? (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void cancelAtPeriodEnd()}
                    disabled={
                      cancelling ||
                      billing.billing.billingCancelAtCycleEnd ||
                      billing.billing.billingStatus !== "active"
                    }
                  >
                    {cancelling ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                    Cancel at period end
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Cancellation keeps your plan active until the current billing cycle ends.
                  </p>
                </div>
              ) : null}

              {billing.plan === "free" ? (
                <div className="mt-6 rounded-xl border p-5">
                  <p className="font-medium">Upgrade to Basic</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Unlock 5 sites, custom domains, branding removal, and full booking features.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <BasicCheckoutButton period="monthly" label="Get Basic Monthly" />
                    <BasicCheckoutButton period="annual" label="Get Basic Annual" onSuccess={() => void load()} />
                  </div>
                </div>
              ) : null}
            </div>

            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Could not load billing.</p>
        )}
      </section>
      <MarketingFooter />
    </main>
  );
}
