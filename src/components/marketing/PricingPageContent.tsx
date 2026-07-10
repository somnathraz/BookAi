"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MarketingBackdrop } from "@/components/marketing/MarketingBackdrop";
import { PricingHero3D } from "@/components/marketing/PricingHero3D";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { PRODUCT_NAME } from "@/lib/brand";

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const VALUE_PROPS = [
  { title: "Start free", body: "One polished site, forever. No card needed." },
  { title: "Grow on Basic", body: "Custom domain, booking, and up to 5 sites." },
  { title: "Cancel anytime", body: "Razorpay subscriptions — stop when you want." },
];

export function PricingPageContent() {
  const reduce = useReducedMotion();

  return (
    <>
      <MarketingBackdrop />

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pb-8 pt-14 sm:px-6 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-10">
          <motion.div
            initial={reduce ? "show" : "hidden"}
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            className="text-center lg:text-left"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="mb-6 rounded-full px-3 py-1">
                <Sparkles className="mr-1.5 size-3.5" />
                Start free — pay only when you grow
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem]"
            >
              Simple, honest pricing
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-4 max-w-xl text-pretty text-lg text-muted-foreground lg:mx-0"
            >
              Your first site is free, forever. Upgrade to Basic when you need
              booking, a custom domain, and more sites.
            </motion.p>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.15, ease: EASE }}
          >
            <PricingHero3D />
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="relative mx-auto max-w-5xl px-6 pb-12">
        <PricingPlans />
      </section>

      {/* Value strip */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.65, ease: EASE }}
        className="relative mx-auto max-w-5xl px-6 pb-16"
      >
        <div className="grid gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 dark:border-white/10 dark:bg-white/10 md:grid-cols-3">
          {VALUE_PROPS.map((v) => (
            <div
              key={v.title}
              className="bg-background/80 p-5 backdrop-blur dark:bg-background/50"
            >
              <p className="text-sm font-semibold">{v.title}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Questions about a plan?{" "}
          <Link href="/about" className="text-foreground underline-offset-4 hover:underline">
            Learn more about {PRODUCT_NAME}
          </Link>
          .
        </p>
      </motion.section>
    </>
  );
}
