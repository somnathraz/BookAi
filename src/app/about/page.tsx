import type { Metadata } from "next";

import { PRODUCT_NAME } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { PaperChaiJsonLd } from "@/components/marketing/PaperChaiJsonLd";
import { AboutContent } from "@/components/marketing/AboutContent";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: `${PRODUCT_NAME} turns your Google Business profile — reviews, photos, and hours — into a polished, booking-ready one-page website in minutes. Built for India's small businesses, clinics, salons, and freelancers.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <PaperChaiJsonLd />
      <MarketingNav />
      <AboutContent />
      <div className="relative mt-auto">
        <MarketingFooter />
      </div>
    </main>
  );
}
