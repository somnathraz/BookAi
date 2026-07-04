"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { BasicCheckoutButton } from "@/components/billing/BasicCheckoutButton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Period = "monthly" | "annual";

const PERIODS: { id: Period; label: string; note?: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "annual", label: "Annual", note: "Save 37%" },
];

interface PriceCell {
  amount: string;
  suffix: string;
  sub?: string;
}

interface Tier {
  name: string;
  tagline: string;
  popular?: boolean;
  price: Record<Period, PriceCell>;
  features: string[];
  cta: string;
  href?: string;
}

const TIERS: Tier[] = [
  {
    name: "Free",
    tagline: "Launch one polished site, on us.",
    price: {
      monthly: { amount: "₹0", suffix: "forever" },
      annual: { amount: "₹0", suffix: "forever" },
    },
    features: [
      "1 AI-generated one-page site",
      "Import from resume, Google Business, a site or LinkedIn",
      "AI copywriting + light/dark with a brand accent",
      "Your photo, contact & social links",
    ],
    cta: "Start free",
    href: "/",
  },
  {
    name: "Basic",
    tagline: "Everything you need to run your business online.",
    popular: true,
    price: {
      monthly: { amount: "₹199", suffix: "/mo" },
      annual: { amount: "₹1,499", suffix: "/yr", sub: "Save ₹889 vs monthly" },
    },
    features: [
      "Everything in Free",
      "Up to 5 sites & unlimited edits",
      "Connect your own custom domain",
      "Remove PaperChai branding",
      "Email + WhatsApp booking",
      "Built-in scheduling & Calendly embed",
    ],
    cta: "Get Basic",
  },
];

export function PricingPlans() {
  const [period, setPeriod] = useState<Period>("annual");

  return (
    <div>
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border bg-card/60 p-1">
          {PERIODS.map((p) => {
            const active = period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
                {p.note ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      active ? "bg-background/20 text-background" : "bg-foreground/10 text-foreground"
                    )}
                  >
                    {p.note}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl items-stretch gap-6 md:grid-cols-2">
        {TIERS.map((tier) => {
          const cell = tier.price[period];
          return (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-3xl border p-8",
                tier.popular
                  ? "border-foreground/30 bg-card shadow-2xl shadow-black/30"
                  : "border-border bg-card/60"
              )}
            >
              {tier.popular ? (
                <Badge className="absolute right-6 top-6 rounded-full">Most popular</Badge>
              ) : null}
              <h2 className="text-lg font-semibold">{tier.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight">{cell.amount}</span>
                <span className="text-sm text-muted-foreground">{cell.suffix}</span>
              </div>
              <div className="mt-1 h-5 text-xs font-medium text-emerald-400">
                {cell.sub ?? ""}
              </div>
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {tier.name === "Basic" ? (
                  <BasicCheckoutButton
                    period={period}
                    size="lg"
                    variant={tier.popular ? "default" : "outline"}
                    className="w-full"
                    label={tier.cta}
                  />
                ) : (
                  <Button size="lg" className="w-full" asChild>
                    <Link href={tier.href ?? "/"}>{tier.cta}</Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Secure payments via Razorpay · cancel anytime · GST invoices included. By subscribing, you
        agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/refunds" className="underline underline-offset-4 hover:text-foreground">
          Refund Policy
        </Link>
        .
      </p>
    </div>
  );
}
