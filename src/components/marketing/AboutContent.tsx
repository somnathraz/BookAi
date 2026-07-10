"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  CalendarCheck,
  Globe,
  MapPin,
  Sparkles,
  Wand2,
} from "lucide-react";

import { PRODUCT_NAME } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AboutFlow3D } from "@/components/marketing/AboutFlow3D";
import { MarketingBackdrop } from "@/components/marketing/MarketingBackdrop";
import { Reveal, Tilt3D } from "@/components/marketing/motion-primitives";

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const STEPS = [
  {
    icon: MapPin,
    step: "01",
    title: "Paste your Google Maps link",
    body: "Your reviews, photos, opening hours, and rating come straight from your Google Business profile. No blank page, no typing it all again.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "Review what we found",
    body: "We show you exactly what was imported — your story, services, and colours. Fix anything before it goes anywhere. Nothing publishes without you.",
  },
  {
    icon: Wand2,
    step: "03",
    title: "Go live with booking built in",
    body: "A polished one-page site on your own link, with slot booking, WhatsApp, and calls — ready to share in minutes.",
  },
];

const stepRise = {
  hidden: { opacity: 0, y: 44, rotateX: 14 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.85, ease: EASE },
  },
};

export function AboutContent() {
  const reduce = useReducedMotion();

  return (
    <>
      <MarketingBackdrop />

      {/* Hero + interactive 3D flow */}
      <section className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
          <motion.div
            initial={reduce ? "show" : "hidden"}
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            className="max-w-2xl"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="mb-6 rounded-full px-3 py-1">
                About {PRODUCT_NAME}
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem]"
            >
              Your business already has a story. We turn it into a website.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground"
            >
              Most website builders hand you a blank canvas. {PRODUCT_NAME}{" "}
              starts from your Google Business profile — reviews, photos, and
              hours — and turns it into a booking-ready site in minutes. Built
              for India&apos;s salons, clinics, consultants, and freelancers.
            </motion.p>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.12, ease: EASE }}
          >
            <AboutFlow3D />
          </motion.div>
        </div>
      </section>

      {/* 3D step cards */}
      <section className="relative mx-auto w-full max-w-5xl px-5 pb-20 sm:px-6">
        <Reveal className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            How it works
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Three steps from Maps link to live site
          </h2>
        </Reveal>

        <motion.ol
          initial={reduce ? "show" : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.18 } } }}
          style={{ perspective: 1200 }}
          className="relative grid gap-4 sm:grid-cols-3"
        >
          {STEPS.map(({ icon: Icon, step, title, body }, i) => (
            <motion.li
              key={step}
              variants={stepRise}
              style={{ transformStyle: "preserve-3d" }}
              className="relative"
            >
              <Tilt3D maxTilt={6} lift className="h-full">
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card/70 p-6 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-background/70 dark:border-white/10 dark:bg-white/[0.04]">
                      <Icon className="size-5 text-foreground" strokeWidth={1.6} />
                    </span>
                    <span className="font-mono text-xs font-medium text-muted-foreground/70">
                      {step}
                    </span>
                  </div>
                  <h3 className="mt-5 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </Tilt3D>
              {i < STEPS.length - 1 ? (
                <div className="flex justify-center py-2 sm:hidden">
                  <ArrowDown className="size-4 text-muted-foreground/60" />
                </div>
              ) : null}
            </motion.li>
          ))}

          {!reduce ? (
            <motion.div
              aria-hidden
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, delay: 0.4, ease: EASE }}
              className="absolute left-[12%] right-[12%] top-1/2 -z-10 hidden h-px origin-left bg-gradient-to-r from-transparent via-border to-transparent sm:block dark:via-white/15"
            />
          ) : null}
        </motion.ol>
      </section>

      {/* Final CTA */}
      <section className="relative mx-auto w-full max-w-3xl px-5 pb-24 sm:px-6">
        <Reveal>
          <Tilt3D maxTilt={4}>
            <div className="overflow-hidden rounded-3xl border bg-card/70 p-8 text-center backdrop-blur sm:p-12">
              <div className="flex justify-center gap-3 text-muted-foreground">
                <MapPin className="size-5" />
                <CalendarCheck className="size-5" />
                <Globe className="size-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                Ready in minutes, free to start
              </h2>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Your first site is on us. Paste your Google Maps link and see it
                — no templates to wrestle, no blank page.
              </p>
              <Button size="lg" asChild className="mt-7">
                <Link href="/">Create your site</Link>
              </Button>
            </div>
          </Tilt3D>
        </Reveal>
      </section>
    </>
  );
}
