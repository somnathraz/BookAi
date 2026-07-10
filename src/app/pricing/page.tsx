import type { Metadata } from "next";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { PricingPageContent } from "@/components/marketing/PricingPageContent";
import { pageMetadata } from "@/lib/seo";
import { PaperChaiJsonLd } from "@/components/marketing/PaperChaiJsonLd";

export const metadata: Metadata = pageMetadata({
  title: "Pricing",
  description:
    "Start free with one AI-generated site on PaperChai. Upgrade to Basic for more sites, custom domains, and booking.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <PaperChaiJsonLd />
      <MarketingNav />
      <PricingPageContent />
      <div className="relative mt-auto">
        <MarketingFooter />
      </div>
    </main>
  );
}
