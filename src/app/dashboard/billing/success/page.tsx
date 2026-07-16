import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Thank you",
  description: "Your PaperChai Basic plan is active.",
  path: "/dashboard/billing/success",
  noIndex: true,
});

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; payment_id?: string }>;
}) {
  const params = await searchParams;
  const period = params.period === "annual" ? "annual" : "monthly";
  const paymentId = params.payment_id?.trim();
  const periodLabel = period === "annual" ? "Annual" : "Monthly";

  return (
    <main className="flex min-h-screen flex-col">
      <MarketingNav />
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <CheckCircle2 className="size-12 text-emerald-500" aria-hidden />
        <Badge variant="secondary" className="mt-4 rounded-full">
          Basic activated
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Thanks for upgrading to Basic
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your subscription is active. You can create up to 5 sites, connect a custom domain, and
          remove PaperChai branding.
        </p>

        <div className="mt-6 w-full rounded-2xl border bg-card/60 p-5 text-left text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground">Billing period</span>
            <span className="font-medium">{periodLabel}</span>
          </div>
          {paymentId ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Payment id</span>
              <span className="break-all font-mono text-xs">{paymentId}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Create a site</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">My sites</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/dashboard/billing">Billing</Link>
          </Button>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
