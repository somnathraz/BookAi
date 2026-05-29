"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Period = "monthly" | "annual" | "lifetime";

const PERIODS: { id: Period; label: string; note?: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "annual", label: "Annual", note: "Save 37%" },
  { id: "lifetime", label: "Lifetime", note: "Launch only" },
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
  soon?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Free",
    tagline: "Launch one polished site, on us.",
    price: {
      monthly: { amount: "₹0", suffix: "forever" },
      annual: { amount: "₹0", suffix: "forever" },
      lifetime: { amount: "₹0", suffix: "forever" },
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
    tagline: "For one professional going pro.",
    price: {
      monthly: { amount: "₹199", suffix: "/mo" },
      annual: { amount: "₹1,499", suffix: "/yr", sub: "Save ₹889 vs monthly" },
      lifetime: { amount: "₹3,999", suffix: "once", sub: "Pay once, yours forever" },
    },
    features: [
      "Everything in Free",
      "Up to 3 sites & unlimited edits",
      "Connect your own custom domain",
      "Remove BookAi branding",
      "Email booking",
    ],
    cta: "Get Basic",
    soon: true,
  },
  {
    name: "Pro",
    tagline: "For creators who want it all.",
    popular: true,
    price: {
      monthly: { amount: "₹349", suffix: "/mo" },
      annual: { amount: "₹2,999", suffix: "/yr", sub: "Save ₹1,189 vs monthly" },
      lifetime: { amount: "₹5,999", suffix: "once", sub: "Pay once, yours forever" },
    },
    features: [
      "Everything in Basic",
      "Unlimited sites",
      "WhatsApp + email booking",
      "Priority AI generation",
      "Advanced visit analytics",
    ],
    cta: "Get Pro",
    soon: true,
  },
];

export function PricingPlans() {
  const [period, setPeriod] = useState<Period>("annual");

  return (
    <div>
      {/* Period toggle */}
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

      {period === "lifetime" ? (
        <p className="mt-5 text-center text-sm text-amber-300/80">
          Lifetime pricing is a launch offer — available for the first 3 months only.
        </p>
      ) : null}

      {/* Tiers */}
      <div className="mt-10 grid items-stretch gap-6 md:grid-cols-3">
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
                {tier.soon ? (
                  <Button size="lg" className="w-full" variant={tier.popular ? "default" : "outline"} disabled>
                    {tier.cta} — soon
                  </Button>
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

      {/* Agency tier — the hidden gem */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-foreground/20 bg-card/60">
        <div className="flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <Users className="size-5" />
              <h2 className="text-lg font-semibold">Agency</h2>
              <Badge variant="secondary" className="rounded-full">Best value</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything in Pro, white-labelled — manage up to{" "}
              <span className="font-medium text-foreground">10 client sites</span>{" "}
              from one dashboard, with client handoff and priority support. Built
              for studios &amp; freelancers running sites for local businesses.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight">₹799</span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
            <Button size="lg" disabled>
              Talk to us — soon
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Secure payments via Razorpay · cancel anytime · GST invoices included.
      </p>
    </div>
  );
}
