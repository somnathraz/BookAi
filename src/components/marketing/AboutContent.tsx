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
import { Button } from "@/components/ui/button";
import { AboutFlow3D } from "@/components/marketing/AboutFlow3D";
import { MarketingBackdrop } from "@/components/marketing/MarketingBackdrop";
import { Reveal } from "@/components/marketing/motion-primitives";

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const STEPS = [
  {
    icon: MapPin,
    step: "01",
    title: "Find your business",
    body: "Search by business name and city. PaperChai can also use a Google Maps Share link, resume, existing website, or short guided brief.",
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
    title: "Publish when it feels right",
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
              <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#214f43] dark:text-[#9cc2b3]">
                <span className="size-1.5 rounded-full bg-[#214f43] dark:bg-[#9cc2b3]" />
                About {PRODUCT_NAME}
              </p>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-balance text-5xl font-medium leading-[0.98] tracking-[-0.05em] text-[#11130f] dark:text-stone-50 sm:text-6xl"
            >
              Your business already has a story. We turn it into a website.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-6 text-pretty text-lg leading-8 text-stone-600 dark:text-stone-300"
            >
              Most website builders hand you a blank canvas. {PRODUCT_NAME}{" "}
              starts from information you already have and turns it into a
              website you can review, edit, and publish. Built for local
              businesses, professionals, creators, and freelancers.
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
          className="relative grid border-t border-[#11130f]/15 dark:border-white/15 sm:grid-cols-3"
        >
          {STEPS.map(({ icon: Icon, step, title, body }, i) => (
            <motion.li
              key={step}
              variants={stepRise}
              style={{ transformStyle: "preserve-3d" }}
              className="relative"
            >
                <div className={`relative flex h-full flex-col py-7 sm:px-7 ${i > 0 ? "border-t border-[#11130f]/10 dark:border-white/10 sm:border-l sm:border-t-0" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-[#dce8e2] text-[#214f43] dark:bg-[#214f43]/20 dark:text-[#9cc2b3]">
                      <Icon className="size-5" strokeWidth={1.6} />
                    </span>
                    <span className="font-mono text-xs font-medium text-muted-foreground/70">
                      {step}
                    </span>
                  </div>
                  <h3 className="mt-5 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
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
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111311] p-8 text-center text-stone-50 shadow-[0_35px_90px_-50px_rgba(17,19,15,0.65)] sm:p-12">
              <div className="flex justify-center gap-3 text-[#9cc2b3]">
                <MapPin className="size-5" />
                <CalendarCheck className="size-5" />
                <Globe className="size-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                Ready in minutes, free to start
              </h2>
              <p className="mx-auto mt-3 max-w-md text-stone-400">
                Your first site is on us. Find your business or start from what
                you already have. No blank page and nothing publishes without you.
              </p>
              <Button size="lg" asChild className="mt-7 bg-[#9cc2b3] text-[#0d0f0d] hover:bg-[#b9d5ca]">
                <Link href="/">Create your site</Link>
              </Button>
            </div>
        </Reveal>
      </section>
    </>
  );
}
