import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Globe, MapPin, Sparkles, Wand2 } from "lucide-react";

import { PRODUCT_NAME } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: `About — ${PRODUCT_NAME}`,
  description: `${PRODUCT_NAME} turns who you already are — your resume, your Google Business page, a site you like — into a polished one-page website in minutes.`,
};

const STEPS = [
  {
    icon: FileText,
    title: "Start from what you have",
    body: "Upload a resume, paste your Google Business or LinkedIn, or point us at a site you like. No blank page.",
  },
  {
    icon: Sparkles,
    title: "We read & understand it",
    body: "AI extracts your story, services, reviews and a colour palette, then shows you exactly what it found.",
  },
  {
    icon: Wand2,
    title: "It writes your site",
    body: "A polished, on-brand one-page site — tailored to your profession, in light or dark, ready to share.",
  },
];

export default function AboutPage() {
  return (
    <main className="relative flex min-h-screen flex-col">
      <MarketingNav />

      <section className="mx-auto max-w-3xl px-6 pb-16 pt-16 sm:pt-24">
        <Badge variant="secondary" className="mb-6 rounded-full px-3 py-1">
          About {PRODUCT_NAME}
        </Badge>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Your site, generated from who you already are
        </h1>
        <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
          Most website builders hand you a blank canvas and a hundred decisions.
          {PRODUCT_NAME} starts from what already exists about you — your resume, your
          Google Business page, your LinkedIn, or a reference site — and turns it
          into a clean, modern one-page site in minutes. Built for India&apos;s
          small businesses, clinics, freelancers and creators.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.title} className="rounded-2xl border bg-card/60 p-6">
              <s.icon className="size-6 text-foreground" strokeWidth={1.6} />
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="rounded-3xl border bg-card/60 p-8 text-center sm:p-12">
          <div className="flex justify-center gap-3 text-muted-foreground">
            <MapPin className="size-5" />
            <Globe className="size-5" />
            <FileText className="size-5" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">
            Ready in minutes, free to start
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Your first site is on us. Create it now — no templates to wrestle, no
            blank page.
          </p>
          <Button size="lg" asChild className="mt-7">
            <Link href="/">Create your site</Link>
          </Button>
        </div>
      </section>

      <div className="mt-auto">
        <MarketingFooter />
      </div>
    </main>
  );
}
