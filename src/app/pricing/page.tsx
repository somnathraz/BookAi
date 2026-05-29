import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { PricingPlans } from "@/components/marketing/PricingPlans";

export const metadata: Metadata = {
  title: "Pricing — BookAi",
  description:
    "Start free with one AI-generated site. Monthly, annual or lifetime plans for more sites, custom domains, booking and an agency tier.",
};

export default function PricingPage() {
  return (
    <main className="relative min-h-screen">
      <MarketingNav />

      <section className="mx-auto max-w-5xl px-6 pb-24 pt-16 sm:pt-24">
        <div className="text-center">
          <Badge variant="secondary" className="mb-6 rounded-full px-3 py-1">
            <Sparkles className="mr-1.5 size-3.5" />
            Start free — pay only when you grow
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Simple, honest pricing
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-muted-foreground">
            Your first site is free, forever. Pick monthly to try, annual to save,
            or grab a lifetime deal while it lasts.
          </p>
        </div>

        <div className="mt-12">
          <PricingPlans />
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Questions about a plan?{" "}
          <Link href="/about" className="text-foreground underline-offset-4 hover:underline">
            Learn more about BookAi
          </Link>
          .
        </p>
      </section>

      <MarketingFooter />
    </main>
  );
}
