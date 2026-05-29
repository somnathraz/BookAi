"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Code2,
  ExternalLink,
  Github,
  Globe,
  Heart,
  Instagram,
  Languages as LanguagesIcon,
  Layers,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Phone,
  Quote,
  Star,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { normalizeCertifications } from "@/lib/certifications";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BentoGrid } from "@/components/ui/bento-grid";
import { resolveIcon } from "@/components/generated/icons";
import { lookupTech, TechLogo } from "@/components/generated/tech-icons";
import { siteStyle } from "@/lib/site-style";
import type {
  SiteData,
  SiteIdentity,
  SiteSection,
  Testimonial,
  ThemeMode,
  WorkItem,
} from "@/lib/types";

const EASE = [0.22, 1, 0.36, 1] as const;

interface ContactLink {
  icon: LucideIcon;
  href: string;
  label: string;
}

function withProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// Build the contact / social buttons from whatever the profile has.
function buildContactLinks(identity: SiteIdentity): ContactLink[] {
  const links: ContactLink[] = [];
  const s = identity.socials ?? {};

  const waRaw = s.whatsapp ?? identity.phone;
  if (waRaw) {
    const digits = waRaw.replace(/[^\d]/g, "");
    if (digits.length >= 8) {
      links.push({ icon: MessageCircle, href: `https://wa.me/${digits}`, label: "WhatsApp" });
    }
  }
  if (identity.email)
    links.push({ icon: Mail, href: `mailto:${identity.email}`, label: "Email" });
  if (identity.phone)
    links.push({ icon: Phone, href: `tel:${identity.phone}`, label: "Call" });
  if (s.github) links.push({ icon: Github, href: withProtocol(s.github), label: "GitHub" });
  if (s.linkedin)
    links.push({ icon: Linkedin, href: withProtocol(s.linkedin), label: "LinkedIn" });
  if (s.instagram)
    links.push({ icon: Instagram, href: withProtocol(s.instagram), label: "Instagram" });
  if (s.website) links.push({ icon: Globe, href: withProtocol(s.website), label: "Website" });

  return links;
}

function ContactRow({
  links,
  accent,
  className,
}: {
  links: ContactLink[];
  accent?: string;
  className?: string;
}) {
  if (!links.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {links.map(({ icon: Icon, href, label }) => {
        const external = href.startsWith("http");
        return (
          <a
            key={label}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            aria-label={label}
            title={label}
            className="flex size-10 items-center justify-center rounded-full border bg-card text-card-foreground transition-colors hover:bg-accent"
            style={accent ? { color: accent } : undefined}
          >
            <Icon className="size-[18px]" strokeWidth={1.7} />
          </a>
        );
      })}
    </div>
  );
}

function Avatar({
  src,
  name,
  className,
}: {
  src: string;
  name: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={cn("object-cover", className)}
      referrerPolicy="no-referrer"
    />
  );
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({
  children,
  accent,
  className,
}: {
  children: ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-xs font-medium text-muted-foreground",
        className ?? "uppercase tracking-[0.2em]"
      )}
      style={accent ? { color: accent } : undefined}
    >
      {children}
    </span>
  );
}

// CTA button: branded (accent bg, white text) when an accent is set, else the
// neutral primary button — keeps SomSite parity with no accent.
function CtaButton({
  accent,
  href,
  children,
  radiusClass,
}: {
  accent?: string;
  href?: string;
  children: ReactNode;
  radiusClass?: string;
}) {
  if (accent) {
    return (
      <Button
        size="lg"
        asChild
        className={cn("border-0 text-white hover:opacity-90", radiusClass)}
        style={{ backgroundColor: accent }}
      >
        <a href={href}>{children}</a>
      </Button>
    );
  }
  return (
    <Button size="lg" asChild className={radiusClass}>
      <a href={href}>{children}</a>
    </Button>
  );
}

// Always renders 5 stars; fills `count` of them so a genuine 4★ review looks
// like 4 of 5, not 4 of 4.
function Stars({ count = 5 }: { count?: number }) {
  const filled = Math.max(0, Math.min(5, count));
  return (
    <div className="flex gap-0.5" aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < filled
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted-foreground/30"
          )}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

// Soft animated accent aurora behind the hero — driven by the brand accent
// (falls back to a neutral foreground glow when no accent is chosen).
function HeroAurora({ accent, y }: { accent?: string; y: MotionValue<number> }) {
  const tint = accent ? `${accent}33` : undefined;
  return (
    <>
      <motion.div
        style={{ y, ...(tint ? { backgroundColor: tint } : {}) }}
        className="pointer-events-none absolute left-[15%] top-[10%] size-[26rem] -translate-x-1/2 rounded-full bg-foreground/10 blur-[100px]"
        animate={{ scale: [1, 1.15, 0.95, 1], x: [0, 40, -20, 0] }}
        transition={{ duration: 18, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        style={{ y, ...(tint ? { backgroundColor: tint } : {}) }}
        className="pointer-events-none absolute right-[10%] top-[30%] size-[22rem] rounded-full bg-foreground/5 blur-[100px]"
        animate={{ scale: [1, 0.9, 1.2, 1], y: [0, 50, -20, 0] }}
        transition={{ duration: 24, ease: "easeInOut", repeat: Infinity }}
      />
    </>
  );
}

function Hero({ site, y, opacity }: { site: SiteData; y: MotionValue<number>; opacity: MotionValue<number> }) {
  const { identity, cta, accent, heroLayout, archetype } = site;
  const st = siteStyle(site.design);
  const contactLinks = buildContactLinks(identity);
  const split = heroLayout === "split" && Boolean(identity.photo);
  const isBusiness = archetype === "business";

  const badges = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
      className={cn(
        "mb-6 flex flex-wrap items-center gap-2",
        split ? "justify-start" : "justify-center"
      )}
    >
      <Badge variant="secondary" className="rounded-full px-3 py-1">
        {identity.name}
      </Badge>
      {identity.location ? (
        <Badge variant="outline" className="rounded-full px-3 py-1">
          <MapPin className="mr-1 size-3" />
          {identity.location}
        </Badge>
      ) : null}
    </motion.div>
  );

  const headline = (
    <motion.h1
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.05, ease: EASE }}
      className={cn("text-balance text-4xl sm:text-6xl", st.heading)}
    >
      {identity.tagline}
    </motion.h1>
  );

  const intro = (
    <motion.p
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
      className={cn(
        "mt-6 max-w-2xl text-pretty text-lg text-muted-foreground",
        split ? "" : "mx-auto"
      )}
    >
      {identity.intro}
    </motion.p>
  );

  const actions = (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
      className={cn(
        "mt-9 flex flex-col gap-5",
        split ? "items-start" : "items-center"
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <CtaButton accent={accent} href={cta.href} radiusClass={st.ctaRadius}>
          {cta.buttonLabel}
          <ArrowRight className="size-4" />
        </CtaButton>
        <Button size="lg" variant="outline" asChild className={st.ctaRadius}>
          <a href="#work">View work</a>
        </Button>
      </div>
      <ContactRow links={contactLinks} accent={accent} />
    </motion.div>
  );

  return (
    <section
      className={cn(
        "relative flex items-center overflow-hidden px-6",
        isBusiness ? "min-h-0 pb-16 pt-14 sm:pb-20 sm:pt-16" : "min-h-[88vh]"
      )}
    >
      <motion.div
        style={{ y, opacity }}
        className="pointer-events-none absolute inset-0 bg-grid-black dark:bg-grid-white"
      />
      <HeroAurora accent={accent} y={y} />
      {/* Dissolve grid + aurora into the page bg so the next section has no hard line. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-28 bg-gradient-to-t from-background from-0% via-background/90 via-45% to-transparent to-100% sm:h-36 md:h-44"
        aria-hidden
      />

      {split ? (
        <div className="relative z-10 mx-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-[1.2fr_1fr]">
          <div className="text-left">
            {badges}
            {headline}
            {intro}
            {actions}
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="relative mx-auto w-full max-w-sm"
          >
            <div
              className="absolute -inset-4 rounded-[2rem] bg-foreground/5 blur-2xl"
              style={accent ? { backgroundColor: `${accent}26` } : undefined}
            />
            <div className="relative overflow-hidden rounded-[1.75rem] border bg-card shadow-2xl">
              <Avatar
                src={identity.photo!}
                name={identity.name}
                className="aspect-[4/5] w-full"
              />
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
          {identity.photo ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="mx-auto mb-7 size-28 overflow-hidden rounded-full border-2 border-border shadow-lg"
            >
              <Avatar src={identity.photo} name={identity.name} className="size-full" />
            </motion.div>
          ) : null}
          {badges}
          {headline}
          {intro}
          {actions}
        </div>
      )}
    </section>
  );
}

type SectionProps = { site: SiteData; section?: SiteSection };

// Soft horizontal fade using the page background — works in light & dark mode
// (mask-image black/transparent cutoffs look harsh on dark backgrounds).
function MarqueeFade({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("group relative overflow-hidden", className)} style={style}>
      {children}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background from-0% via-background/80 via-35% to-transparent to-100% sm:w-28 md:w-36"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background from-0% via-background/80 via-35% to-transparent to-100% sm:w-28 md:w-36"
        aria-hidden
      />
    </div>
  );
}

function splitBioParagraphs(body: string): string[] {
  const trimmed = body.trim();
  if (!trimmed) return [];
  if (trimmed.includes("\n\n")) {
    return trimmed.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  }
  if (trimmed.includes("\n")) {
    return trimmed.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  }
  return [trimmed];
}

function AboutSection({ site, section }: SectionProps) {
  const { bio, gallery, accent, archetype } = site;
  const st = siteStyle(site.design);
  const isBusiness = archetype === "business";
  const isProfile = archetype === "profile";
  const bioParagraphs = splitBioParagraphs(bio.body);

  return (
    <section
      id="about"
      className={cn(
        "mx-auto max-w-5xl px-6",
        isBusiness ? "relative -mt-10 pb-0 pt-2 sm:-mt-12 sm:pt-3" : st.pad
      )}
    >
      <Reveal>
        <SectionLabel accent={accent} className={st.eyebrow}>
          {section?.label ?? "About"}
        </SectionLabel>

        {isBusiness ? (
          <>
            {/* Business: pull-quote style — not a second giant hero-sized header. */}
            <p
              className={cn(
                "mt-4 max-w-2xl text-pretty text-xl leading-snug sm:text-2xl",
                st.heading
              )}
            >
              {section?.heading ?? bio.heading}
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {bio.body}
            </p>

            {bio.stats.length ? (
              <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
                {bio.stats.map((s) => (
                  <div
                    key={s.label}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 text-center sm:p-5",
                      st.card
                    )}
                  >
                    <div
                      className={cn("text-2xl sm:text-3xl", st.heading)}
                      style={accent ? { color: accent } : undefined}
                    >
                      {s.value}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {gallery.length ? (
              <PhotoFilmstrip images={gallery.slice(0, 12)} className="mt-6" />
            ) : null}
          </>
        ) : (
          <>
            <h2 className={cn("mt-3 max-w-3xl text-3xl sm:text-4xl", st.heading)}>
              {section?.heading ?? bio.heading}
            </h2>
            <div
              className={cn(
                "mt-5 max-w-3xl space-y-4 leading-relaxed text-muted-foreground",
                isProfile ? "text-base sm:text-lg sm:leading-8" : "max-w-2xl text-lg"
              )}
            >
              {bioParagraphs.map((para, i) => (
                <p key={i} className="text-pretty">
                  {para}
                </p>
              ))}
            </div>
          </>
        )}
      </Reveal>
    </section>
  );
}

// Horizontal photo filmstrip — fills the gap between welcome copy and the next
// section header on business sites. Auto-scrolls like the tech marquee.
function PhotoFilmstrip({
  images,
  className,
}: {
  images: string[];
  className?: string;
}) {
  if (!images.length) return null;
  const track =
    images.length < 5 ? [...images, ...images, ...images] : images;

  return (
    <MarqueeFade className={cn("flex [--duration:45s] [--gap:0.75rem]", className)}>
      {[0, 1].map((dup) => (
        <div
          key={dup}
          aria-hidden={dup === 1}
          className="flex shrink-0 animate-marquee gap-3 pr-3 group-hover:[animation-play-state:paused]"
        >
          {track.map((src, i) => (
            <div
              key={`${dup}-${i}-${src}`}
              className="relative h-28 w-44 shrink-0 overflow-hidden rounded-2xl border bg-muted shadow-md transition-shadow hover:shadow-lg sm:h-32 sm:w-52"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="size-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>
      ))}
    </MarqueeFade>
  );
}

function StatsSection({ site }: SectionProps) {
  const { bio } = site;
  const st = siteStyle(site.design);
  if (!bio.stats.length) return null;
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <Reveal>
        <div className="grid grid-cols-3 gap-4">
          {bio.stats.map((s) => (
            <div
              key={s.label}
              className={cn("p-5 text-card-foreground sm:p-6", st.card)}
            >
              <div className={cn("text-3xl sm:text-4xl", st.heading)}>
                {s.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ── Tech marquee (shared everywhere tech logos appear) ───────────────────────

type TechMarqueeVariant = "pill" | "tile";

function TechMarqueeItem({
  label,
  variant,
  accent,
  compact,
}: {
  label: string;
  variant: TechMarqueeVariant;
  accent?: string;
  compact?: boolean;
}) {
  const icon = lookupTech(label);
  if (variant === "tile") {
    return (
      <span
        title={label}
        className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background/70 shadow-sm backdrop-blur-md"
      >
        {icon ? (
          <TechLogo icon={icon} brand className="size-5" />
        ) : (
          <Code2 className="size-5 text-muted-foreground" strokeWidth={1.6} />
        )}
      </span>
    );
  }
  if (compact) {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium text-foreground/80"
        style={
          accent
            ? { borderColor: `${accent}59`, color: accent, backgroundColor: `${accent}12` }
            : undefined
        }
      >
        {icon ? <TechLogo icon={icon} className="size-3.5" /> : null}
        {label}
      </span>
    );
  }
  return (
    <span className="flex shrink-0 items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-sm">
      {icon ? (
        <TechLogo icon={icon} brand className="size-4" />
      ) : (
        <Code2 className="size-4 text-muted-foreground" strokeWidth={1.7} />
      )}
      {label}
    </span>
  );
}

// Infinite auto-scrolling marquee of technology logos. Used for the skills
// section, experience tech stacks, and project/work card covers.
function TechMarquee({
  items,
  variant = "pill",
  duration = "32s",
  className,
  accent,
  compact,
  masked = false,
}: {
  items: string[];
  variant?: TechMarqueeVariant;
  duration?: string;
  className?: string;
  accent?: string;
  compact?: boolean;
  masked?: boolean;
}) {
  if (!items.length) return null;
  const track =
    items.length < 4 ? [...items, ...items, ...items] : items.length < 8 ? [...items, ...items] : items;

  const rows = (
    <>
      {[0, 1].map((dup) => (
        <div
          key={dup}
          aria-hidden={dup === 1}
          className="flex shrink-0 animate-marquee gap-3 pr-3 group-hover:[animation-play-state:paused]"
        >
          {track.map((label, i) => (
            <TechMarqueeItem
              key={`${dup}-${i}-${label}`}
              label={label}
              variant={variant}
              accent={accent}
              compact={compact}
            />
          ))}
        </div>
      ))}
    </>
  );

  const style = { "--duration": duration } as CSSProperties;

  if (masked) {
    return (
      <MarqueeFade className={cn("flex [--gap:0.75rem]", className)} style={style}>
        {rows}
      </MarqueeFade>
    );
  }

  return (
    <div
      className={cn("group relative flex overflow-hidden [--gap:0.75rem]", className)}
      style={style}
    >
      {rows}
    </div>
  );
}

// Infinite, auto-scrolling marquee of technologies / tools mastered.
function SkillsSection({ site, section }: SectionProps) {
  const skills = site.skills ?? [];
  const st = siteStyle(site.design);
  if (!skills.length) return null;
  return (
    <section id="skills" className={cn("overflow-hidden", st.pad)}>
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <SectionLabel accent={site.accent} className={st.eyebrow}>
            {section?.label ?? "Skills"}
          </SectionLabel>
          <h2 className={cn("mt-3 text-3xl sm:text-4xl", st.heading)}>
            {section?.heading ?? "Tools & technologies"}
          </h2>
        </Reveal>
      </div>
      <Reveal delay={0.1} className="mt-10">
        <TechMarquee items={skills} variant="pill" duration="32s" masked />
      </Reveal>
    </section>
  );
}

// Career / role timeline — the profile archetype's take on "work". Each entry
// is a proper experience card: role + company, dates, achievement bullets, and
// the tech stack used — not a single line.
function ExperienceSection({ site, section }: SectionProps) {
  const { work, accent } = site;
  const st = siteStyle(site.design);
  if (!work.length) return null;
  return (
    <section id="work" className={cn("mx-auto max-w-5xl px-6", st.pad)}>
      <Reveal>
        <SectionLabel accent={accent} className={st.eyebrow}>
          {section?.label ?? "Experience"}
        </SectionLabel>
        <h2 className={cn("mt-3 text-3xl sm:text-4xl", st.heading)}>
          {section?.heading ?? site.sectionLabels.work}
        </h2>
      </Reveal>
      <Reveal delay={0.1} className="mt-10">
        <ol className="relative ml-1 border-l border-border/80 pl-7">
          {work.map((item, i) => (
            <motion.li
              key={`${item.title}-${i}`}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: EASE }}
              className="group relative mb-10 last:mb-0"
            >
              {/* timeline node */}
              <span
                className="absolute -left-[34px] top-1 flex size-3.5 items-center justify-center rounded-full border-2 border-background bg-foreground transition-transform group-hover:scale-125"
                style={accent ? { backgroundColor: accent } : undefined}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2.5">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  {item.tag ? (
                    <span
                      className="text-sm font-medium text-muted-foreground"
                      style={accent ? { color: accent } : undefined}
                    >
                      {item.tag}
                    </span>
                  ) : null}
                </div>
                {item.period ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="size-3.5" strokeWidth={1.7} />
                    {item.period}
                  </span>
                ) : null}
              </div>

              {item.description ? (
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  {item.description}
                </p>
              ) : null}

              {item.highlights?.length ? (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {item.highlights.map((h, hi) => (
                    <li key={hi} className="flex items-start gap-2.5 text-sm leading-relaxed">
                      <ArrowRight
                        className="mt-1 size-3.5 shrink-0 text-muted-foreground"
                        strokeWidth={2}
                        style={accent ? { color: accent } : undefined}
                      />
                      <span className="text-foreground/80">{h}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {item.tech?.length ? (
                <div className="mt-3.5 max-w-2xl">
                  <TechMarquee
                    items={item.tech}
                    variant="pill"
                    compact
                    accent={accent}
                    duration="22s"
                    masked
                  />
                </div>
              ) : null}
            </motion.li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}

// Soft, slow-drifting aurora used behind feature sections (gallery, reviews).
function SectionAurora({ accent }: { accent?: string }) {
  const tint = accent ?? "#6366f1";
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-[10%] top-[-20%] size-[34rem] rounded-full blur-[120px]"
        style={{ backgroundColor: `${tint}1f` }}
        animate={{ x: [0, 60, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 22, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute right-[-10%] bottom-[-20%] size-[30rem] rounded-full blur-[120px]"
        style={{ backgroundColor: `${tint}17` }}
        animate={{ x: [0, -50, 0], y: [0, -24, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 28, ease: "easeInOut", repeat: Infinity }}
      />
      {/* Fade aurora into the page background so blob edges never show a hard line. */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background to-transparent sm:h-36" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent sm:h-36" />
    </div>
  );
}

// Vary tile sizes for a dynamic, app-icon-like mosaic.
function gallerySpan(i: number): string {
  const m = i % 7;
  if (m === 0) return "col-span-2 row-span-2"; // hero tile
  if (m === 3) return "row-span-2"; // tall
  if (m === 5) return "col-span-2"; // wide
  return "";
}

// Real-photo grid — the business archetype's signature block. A stylish,
// animated mosaic (or a slider) sitting over a soft aurora.
function GallerySection({ site, section }: SectionProps) {
  const { gallery, accent } = site;
  const st = siteStyle(site.design);
  const variant = site.design.variants.gallery ?? "masonry";
  if (!gallery.length) return null;

  const imgRadius = st.card.includes("rounded-none")
    ? "rounded-none"
    : st.card.includes("rounded-3xl")
      ? "rounded-3xl"
      : st.card.includes("rounded-2xl")
        ? "rounded-2xl"
        : "rounded-2xl";

  return (
    <section id="gallery" className={cn("relative mx-auto max-w-6xl px-6", st.pad)}>
      <SectionAurora accent={accent} />
      <Reveal>
        <SectionLabel accent={accent} className={st.eyebrow}>
          {section?.label ?? "Gallery"}
        </SectionLabel>
        <h2 className={cn("mt-3 text-3xl sm:text-4xl", st.heading)}>
          {section?.heading ?? "A look inside"}
        </h2>
      </Reveal>
      <Reveal delay={0.1} className="mt-10">
        {variant === "carousel" ? (
          // Horizontal scroll-snap slider — no JS needed.
          <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {gallery.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className={cn(
                  "relative aspect-[4/3] min-w-[78%] shrink-0 snap-center overflow-hidden border bg-muted shadow-sm sm:min-w-[46%] lg:min-w-[32%]",
                  imgRadius
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="size-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        ) : (
          // Dynamic mosaic: varied tile spans, rounded tiles, hover zoom.
          <div className="grid auto-rows-[7.5rem] grid-cols-2 gap-3 sm:auto-rows-[9rem] sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((src, i) => (
              <motion.div
                key={`${src}-${i}`}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: (i % 8) * 0.05, ease: EASE }}
                className={cn(
                  "group relative overflow-hidden border bg-muted shadow-sm ring-0 ring-foreground/10 transition-all hover:shadow-lg hover:ring-2",
                  imgRadius,
                  gallerySpan(i)
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </motion.div>
            ))}
          </div>
        )}
      </Reveal>
    </section>
  );
}

function ServicesSection({ site, section }: SectionProps) {
  const { services, sectionLabels, accent, archetype } = site;
  const st = siteStyle(site.design);
  const variant = site.design.variants.services ?? "bento";
  const isBusiness = archetype === "business";
  if (!services.length) return null;

  const header = (
    <Reveal>
      <SectionLabel accent={accent} className={st.eyebrow}>
        {section?.label ?? "Services"}
      </SectionLabel>
      <h2 className={cn("mt-3 text-3xl sm:text-4xl", st.heading)}>
        {section?.heading ?? sectionLabels.services}
      </h2>
    </Reveal>
  );

  return (
    <section
      id="services"
      className={cn(
        "relative mx-auto max-w-5xl px-6",
        isBusiness ? "pb-12 pt-4 sm:pt-6" : st.pad
      )}
    >
      {isBusiness ? (
        <div
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
          aria-hidden
        />
      ) : null}
      {header}
      <Reveal delay={0.1} className="mt-10">
        {variant === "list" ? (
          <div className={cn("divide-y overflow-hidden", st.card)}>
            {services.map((service) => {
              const Icon = resolveIcon(service.icon);
              return (
                <div key={service.title} className="flex items-start gap-4 p-6">
                  <Icon className="size-7 shrink-0 text-foreground" strokeWidth={1.5} style={accent ? { color: accent } : undefined} />
                  <div>
                    <h3 className="text-lg font-semibold">{service.title}</h3>
                    <p className="mt-1 text-muted-foreground">{service.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : variant === "cards" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = resolveIcon(service.icon);
              return (
                <div
                  key={service.title}
                  className={cn("group flex flex-col gap-3 p-6 text-card-foreground transition-all hover:shadow-md", st.card)}
                >
                  <Icon className="size-10 text-foreground transition-transform duration-300 group-hover:scale-90" strokeWidth={1.5} />
                  <h3 className="text-xl font-semibold">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <BentoGrid className="auto-rows-[16rem]">
            {services.map((service, i) => {
              const Icon = resolveIcon(service.icon);
              return (
                <div
                  key={service.title}
                  className={cn(
                    "group relative flex flex-col justify-between overflow-hidden p-6 text-card-foreground transition-all hover:shadow-md",
                    st.card,
                    i === 0 ? "col-span-3 md:col-span-2" : "col-span-3 md:col-span-1"
                  )}
                >
                  <div className="absolute right-6 top-6 size-24 rounded-full bg-foreground/[0.04] blur-2xl transition-all group-hover:bg-foreground/[0.07]" />
                  <Icon
                    className="size-10 text-foreground transition-transform duration-300 group-hover:scale-90"
                    strokeWidth={1.5}
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{service.title}</h3>
                    <p className="mt-2 text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </BentoGrid>
        )}
      </Reveal>
    </section>
  );
}

// Animated aurora used as the "cover" for a project card when there's no
// screenshot. Soft accent-tinted blobs drift behind the tech logos.
function CardAurora({ accent, seed = 0 }: { accent?: string; seed?: number }) {
  const tint = accent ?? "#6366f1";
  const flip = seed % 2 === 0;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(120% 120% at ${flip ? "15% 10%" : "85% 15%"}, ${tint}26, transparent 60%)`,
        }}
      />
      <motion.div
        className="absolute -top-6 size-40 rounded-full blur-2xl"
        style={{ backgroundColor: `${tint}3a`, left: flip ? "8%" : "auto", right: flip ? "auto" : "8%" }}
        animate={{ x: [0, flip ? 30 : -30, 0], y: [0, 18, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 12 + seed * 2, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-[-30%] right-[-10%] size-44 rounded-full blur-3xl"
        style={{ backgroundColor: `${tint}26` }}
        animate={{ x: [0, -24, 0], y: [0, -16, 0], scale: [1, 1.2, 0.95, 1] }}
        transition={{ duration: 16 + seed * 2, ease: "easeInOut", repeat: Infinity }}
      />
      <div className="absolute inset-0 bg-grid-black dark:bg-grid-white" />
    </div>
  );
}

function WorkSection({ site, section }: SectionProps) {
  const { work, sectionLabels, accent } = site;
  const st = siteStyle(site.design);
  const variant = site.design.variants.work ?? "grid";
  if (!work.length) return null;

  const mediaRadius = st.card.includes("rounded-none")
    ? "rounded-none"
    : st.card.includes("rounded-3xl")
      ? "rounded-t-3xl"
      : st.card.includes("rounded-2xl")
        ? "rounded-t-2xl"
        : "rounded-t-xl";

  const card = (item: WorkItem, i: number) => {
    const tech = (item.tech ?? []).slice(0, 6);
    return (
      <motion.div
        key={item.title}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.25, ease: EASE }}
        className={cn(
          "group relative flex flex-col overflow-hidden text-card-foreground transition-all hover:shadow-md",
          variant === "masonry" && "mb-4 break-inside-avoid",
          st.card
        )}
      >
        {/* cover: tech logos over an animated aurora (no screenshot needed) */}
        <div className={cn("relative h-36 overflow-hidden border-b", mediaRadius)}>
          <CardAurora accent={accent} seed={i} />
          <span
            className="pointer-events-none absolute right-4 top-2 text-6xl font-semibold tabular-nums text-foreground/[0.08]"
            aria-hidden
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          {tech.length ? (
            <div className="absolute inset-0 flex items-center">
              <TechMarquee
                items={tech}
                variant="tile"
                duration="18s"
                masked
                className="w-full"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-12 items-center justify-center rounded-2xl border bg-background/70 shadow-sm backdrop-blur-md">
                <Layers
                  className="size-6 text-foreground"
                  strokeWidth={1.6}
                  style={accent ? { color: accent } : undefined}
                />
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-6">
          {item.tag ? (
            <Badge
              variant="secondary"
              className="w-fit rounded-full"
              style={accent ? { color: accent } : undefined}
            >
              {item.tag}
            </Badge>
          ) : null}
          <h3 className="text-lg font-semibold">{item.title}</h3>
          {item.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          ) : null}
          <div
            className="mt-auto flex items-center gap-1 pt-3 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100"
            style={accent ? { color: accent } : undefined}
          >
            Learn more
            <ArrowRight className="size-3.5" />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section id="work" className={cn("mx-auto max-w-5xl px-6", st.pad)}>
      <Reveal>
        <SectionLabel accent={accent} className={st.eyebrow}>
          {section?.label ?? "Work"}
        </SectionLabel>
        <h2 className={cn("mt-3 text-3xl sm:text-4xl", st.heading)}>
          {section?.heading ?? sectionLabels.work}
        </h2>
      </Reveal>
      <Reveal delay={0.1} className="mt-10">
        {variant === "masonry" ? (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {work.map((item, i) => card(item, i))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {work.map((item, i) => card(item, i))}
          </div>
        )}
      </Reveal>
    </section>
  );
}

// Personal / side projects in a horizontal slider with prev/next arrows.
function ProjectsSection({ site, section }: SectionProps) {
  const projects = site.projects ?? [];
  const st = siteStyle(site.design);
  const accent = site.accent;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const syncArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    syncArrows();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", syncArrows, { passive: true });
    window.addEventListener("resize", syncArrows);
    return () => {
      el.removeEventListener("scroll", syncArrows);
      window.removeEventListener("resize", syncArrows);
    };
  }, [projects.length]);

  function scrollProjects(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-project-card]");
    const step = card ? card.offsetWidth + 16 : 296;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  if (!projects.length) return null;

  const mediaRadius = st.card.includes("rounded-none")
    ? "rounded-none"
    : st.card.includes("rounded-3xl")
      ? "rounded-t-3xl"
      : st.card.includes("rounded-2xl")
        ? "rounded-t-2xl"
        : "rounded-t-xl";

  return (
    <section id="projects" className={cn("mx-auto max-w-5xl px-6", st.pad)}>
      <Reveal>
        <SectionLabel accent={accent} className={st.eyebrow}>
          {section?.label ?? "Projects"}
        </SectionLabel>
        <div className="mt-3 flex items-end justify-between gap-4">
          <h2 className={cn("text-3xl sm:text-4xl", st.heading)}>
            {section?.heading ?? "Things I've built"}
          </h2>
          {projects.length > 1 ? (
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 rounded-full"
                aria-label="Previous project"
                disabled={!canPrev}
                onClick={() => scrollProjects(-1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 rounded-full"
                aria-label="Next project"
                disabled={!canNext}
                onClick={() => scrollProjects(1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </Reveal>
      <Reveal delay={0.1} className="relative mt-8">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent"
          aria-hidden
        />
        <div
          ref={scrollRef}
          className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {projects.map((item, i) => {
            const tech = (item.tech ?? []).slice(0, 6);
            const inner = (
              <>
                <div className={cn("relative h-32 overflow-hidden border-b", mediaRadius)}>
                  <CardAurora accent={accent} seed={i} />
                  {tech.length ? (
                    <div className="absolute inset-0 flex items-center">
                      <TechMarquee
                        items={tech}
                        variant="tile"
                        duration="18s"
                        masked
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex size-12 items-center justify-center rounded-2xl border bg-background/70 shadow-sm backdrop-blur-md">
                        <Layers
                          className="size-6 text-foreground"
                          strokeWidth={1.6}
                          style={accent ? { color: accent } : undefined}
                        />
                      </span>
                    </div>
                  )}
                  {item.link ? (
                    <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full border bg-background/80 text-foreground shadow-sm backdrop-blur-md">
                      <ExternalLink className="size-4" strokeWidth={1.8} />
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-5">
                  {item.tag ? (
                    <Badge
                      variant="secondary"
                      className="w-fit rounded-full text-xs"
                      style={accent ? { color: accent } : undefined}
                    >
                      {item.tag}
                    </Badge>
                  ) : null}
                  <h3 className="text-base font-semibold leading-snug">{item.title}</h3>
                  {item.description ? (
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </>
            );
            const cardClass = cn(
              "group relative flex w-[248px] shrink-0 snap-start flex-col overflow-hidden text-card-foreground transition-all hover:shadow-md sm:w-[272px]",
              st.card
            );
            return item.link ? (
              <a
                key={`${item.title}-${i}`}
                href={withProtocol(item.link)}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClass}
                data-project-card
              >
                {inner}
              </a>
            ) : (
              <div key={`${item.title}-${i}`} className={cardClass} data-project-card>
                {inner}
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}

const REVIEW_CLAMP = 220;

function TestimonialCard({
  t,
  cardClass,
  className,
  accent,
}: {
  t: Testimonial;
  cardClass: string;
  className?: string;
  accent?: string;
}) {
  const long = t.quote.length > REVIEW_CLAMP;
  const [expanded, setExpanded] = useState(false);
  const shown = long && !expanded ? `${t.quote.slice(0, REVIEW_CLAMP).trimEnd()}…` : t.quote;
  return (
    <div className={cn("relative flex flex-col p-6 text-card-foreground", cardClass, className)}>
      <div className="flex items-center justify-between">
        <Stars count={Math.round(t.rating ?? 5)} />
        <Quote className="size-7 text-muted-foreground/25" />
      </div>
      <p className="mt-4 text-base leading-relaxed">&ldquo;{shown}&rdquo;</p>
      {long ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 w-fit text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          style={accent ? { color: accent } : undefined}
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      ) : null}
      <div className="mt-auto flex items-center gap-3 pt-5">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
          {t.author.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <span className="truncate">{t.author}</span>
            {t.verified ? (
              <BadgeCheck
                className="size-4 shrink-0 text-sky-500"
                strokeWidth={2}
                aria-label="Verified review"
              />
            ) : null}
          </div>
          {t.role ? <div className="text-xs text-muted-foreground">{t.role}</div> : null}
        </div>
      </div>
    </div>
  );
}

function TestimonialsSection({ site, section }: SectionProps) {
  const { testimonials, sectionLabels } = site;
  const st = siteStyle(site.design);
  const variant = site.design.variants.testimonials ?? "cards";
  if (!testimonials.length) return null;

  return (
    <section id="reviews" className={cn("relative mx-auto max-w-6xl px-6", st.pad)}>
      <SectionAurora accent={site.accent} />
      <Reveal>
        <SectionLabel accent={site.accent} className={st.eyebrow}>
          {section?.label ?? "Reviews"}
        </SectionLabel>
        <h2 className={cn("mt-3 text-3xl sm:text-4xl", st.heading)}>
          {section?.heading ?? sectionLabels.testimonials}
        </h2>
      </Reveal>
      <Reveal delay={0.1} className="mt-10">
        {variant === "marquee" && testimonials.length > 1 ? (
          // Auto-scrolling slider; pauses on hover. Duplicated for a seamless loop.
          <MarqueeFade className="flex [--duration:40s] [--gap:1rem]">
            {[0, 1].map((dup) => (
              <div
                key={dup}
                aria-hidden={dup === 1}
                className="flex shrink-0 animate-marquee gap-4 pr-4 group-hover:[animation-play-state:paused]"
              >
                {testimonials.map((t, i) => (
                  <TestimonialCard
                    key={`${dup}-${i}`}
                    t={t}
                    cardClass={st.card}
                    accent={site.accent}
                    className="w-[20rem] shrink-0 sm:w-[24rem]"
                  />
                ))}
              </div>
            ))}
          </MarqueeFade>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} t={t} cardClass={st.card} accent={site.accent} />
            ))}
          </div>
        )}
      </Reveal>
    </section>
  );
}

function CertificationsSection({ site, section }: SectionProps) {
  const items = normalizeCertifications(site.certifications, site.identity.domain);
  const st = siteStyle(site.design);
  const accent = site.accent;
  if (!items.length) return null;
  return (
    <section id="certifications" className={cn("mx-auto max-w-5xl px-6", st.pad)}>
      <Reveal>
        <SectionLabel accent={accent} className={st.eyebrow}>
          {section?.label ?? "Credentials"}
        </SectionLabel>
        <h2 className={cn("mt-3 text-3xl sm:text-4xl", st.heading)}>
          {section?.heading ?? "Certifications & awards"}
        </h2>
      </Reveal>
      <Reveal delay={0.1} className="mt-10">
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((c, i) => (
            <div
              key={`${c.name}-${i}`}
              className={cn("flex items-start gap-3 p-4 text-card-foreground", st.card)}
            >
              <Award
                className="mt-0.5 size-5 shrink-0 text-foreground"
                strokeWidth={1.6}
                style={accent ? { color: accent } : undefined}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug">{c.name}</p>
                {c.detail ? (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {c.detail}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// Compact chip list shared by languages & interests.
function ChipListSection({
  site,
  section,
  items,
  fallbackLabel,
  fallbackHeading,
  icon: Icon,
  id,
}: SectionProps & {
  items: string[];
  fallbackLabel: string;
  fallbackHeading: string;
  icon: LucideIcon;
  id: string;
}) {
  const st = siteStyle(site.design);
  const accent = site.accent;
  if (!items.length) return null;
  return (
    <section id={id} className={cn("mx-auto max-w-5xl px-6", st.pad)}>
      <Reveal>
        <SectionLabel accent={accent} className={st.eyebrow}>
          {section?.label ?? fallbackLabel}
        </SectionLabel>
        <h2 className={cn("mt-3 text-3xl sm:text-4xl", st.heading)}>
          {section?.heading ?? fallbackHeading}
        </h2>
      </Reveal>
      <Reveal delay={0.1} className="mt-8">
        <div className="flex flex-wrap gap-2.5">
          {items.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-sm"
            >
              <Icon
                className="size-4 text-muted-foreground"
                strokeWidth={1.7}
                style={accent ? { color: accent } : undefined}
              />
              {item}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function LanguagesSection({ site, section }: SectionProps) {
  return (
    <ChipListSection
      site={site}
      section={section}
      items={site.languages ?? []}
      fallbackLabel="Languages"
      fallbackHeading="Languages I speak"
      icon={LanguagesIcon}
      id="languages"
    />
  );
}

function InterestsSection({ site, section }: SectionProps) {
  return (
    <ChipListSection
      site={site}
      section={section}
      items={site.interests ?? []}
      fallbackLabel="Beyond work"
      fallbackHeading="Hobbies & interests"
      icon={Heart}
      id="interests"
    />
  );
}

function CtaSection({ site }: SectionProps) {
  const { cta, identity, accent } = site;
  const st = siteStyle(site.design);
  const contactLinks = buildContactLinks(identity);
  const whatsapp = contactLinks.find((l) => l.label === "WhatsApp");
  return (
    <section id="contact" className="mx-auto max-w-5xl px-6 pb-24 pt-12">
      <Reveal>
        <div className={cn("relative overflow-hidden p-10 text-center text-card-foreground sm:p-16", st.card)}>
          <div className="pointer-events-none absolute inset-0 bg-grid-black opacity-50 dark:bg-grid-white" />
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 rounded-full bg-foreground/5 blur-3xl"
            style={accent ? { backgroundColor: `${accent}26` } : undefined}
          />
          <div className="relative">
            <h2 className={cn("text-3xl sm:text-4xl", st.heading)}>
              {cta.heading}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {cta.subtext}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <CtaButton accent={accent} href={cta.href} radiusClass={st.ctaRadius}>
                {cta.buttonLabel}
                <ArrowRight className="size-4" />
              </CtaButton>
              {whatsapp ? (
                <Button size="lg" variant="outline" asChild className={st.ctaRadius}>
                  <a href={whatsapp.href} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4" />
                    WhatsApp
                  </a>
                </Button>
              ) : identity.phone ? (
                <Button size="lg" variant="outline" asChild className={st.ctaRadius}>
                  <a href={`tel:${identity.phone}`}>Call {identity.phone}</a>
                </Button>
              ) : null}
            </div>
            <ContactRow links={contactLinks} accent={accent} className="mt-8 justify-center" />
          </div>
        </div>
      </Reveal>
      <footer className="mt-10 flex flex-col items-center justify-between gap-2 border-t pt-8 text-sm text-muted-foreground sm:flex-row">
        <span>
          © {new Date().getFullYear()} {identity.name}
        </span>
        <span>Built with BookAi</span>
      </footer>
    </section>
  );
}

// Theme toggle that ships INSIDE the generated site's header, so a published
// site lets visitors flip light/dark themselves.
function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: ThemeMode;
  onToggle: () => void;
}) {
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light mode" : "Dark mode"}
      className="relative flex size-9 items-center justify-center rounded-full border bg-card text-card-foreground transition-colors hover:bg-accent"
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="flex items-center justify-center"
      >
        {dark ? (
          <Moon className="size-[18px]" strokeWidth={1.7} />
        ) : (
          <Sun className="size-[18px]" strokeWidth={1.7} />
        )}
      </motion.span>
    </button>
  );
}

function SiteNav({
  site,
  theme,
  onToggleTheme,
}: {
  site: SiteData;
  theme: ThemeMode;
  onToggleTheme: () => void;
}) {
  const { identity, cta, accent } = site;
  const st = siteStyle(site.design);
  const links = [
    { href: "#about", label: "About" },
    { href: "#services", label: site.sectionLabels.services },
    { href: "#work", label: site.sectionLabels.work },
    { href: "#contact", label: "Contact" },
  ];
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
      <a href="#" className="flex min-w-0 items-center gap-2.5 font-semibold">
        {identity.photo ? (
          <span className="size-8 shrink-0 overflow-hidden rounded-full border">
            <Avatar src={identity.photo} name={identity.name} className="size-full" />
          </span>
        ) : (
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: accent ?? "currentColor" }}
          >
            {identity.name.charAt(0)}
          </span>
        )}
        <span className="truncate">{identity.name}</span>
      </a>
      <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
        {links.map((l) => (
          <a key={l.href} href={l.href} className="transition-colors hover:text-foreground">
            {l.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-2.5">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <Button
          size="sm"
          asChild
          className={cn(accent ? "border-0 text-white hover:opacity-90" : "", st.ctaRadius)}
          style={accent ? { backgroundColor: accent } : undefined}
        >
          <a href={cta.href}>{cta.buttonLabel}</a>
        </Button>
      </div>
    </header>
  );
}

// Maps each composed section type to its renderer. "experience" and "portfolio"
// are two presentations of the same work data; "about"/"stats" were split out
// of the old bio block so the AI can order them independently.
const SECTION_REGISTRY: Record<
  SiteSection["type"],
  (props: SectionProps) => ReactNode
> = {
  about: AboutSection,
  stats: StatsSection,
  skills: SkillsSection,
  services: ServicesSection,
  experience: ExperienceSection,
  projects: ProjectsSection,
  portfolio: WorkSection,
  gallery: GallerySection,
  certifications: CertificationsSection,
  languages: LanguagesSection,
  interests: InterestsSection,
  testimonials: TestimonialsSection,
  cta: CtaSection,
};

export function GeneratedSite({
  site,
  theme,
  onThemeChange,
}: {
  site: SiteData;
  theme: ThemeMode;
  /** When provided the theme is controlled by the parent (e.g. the Studio
   *  preview); otherwise the header toggle manages it locally so the site is
   *  self-contained when shipped. */
  onThemeChange?: (theme: ThemeMode) => void;
}) {
  const [internalTheme, setInternalTheme] = useState<ThemeMode>(theme);
  useEffect(() => setInternalTheme(theme), [theme]);
  const activeTheme = internalTheme;
  const toggleTheme = () => {
    const next: ThemeMode = activeTheme === "dark" ? "light" : "dark";
    setInternalTheme(next);
    onThemeChange?.(next);
  };

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  // Use the composed ordering when present; otherwise fall back to the classic
  // fixed layout so older SiteData still renders.
  const sections: SiteSection[] =
    site.sections && site.sections.length
      ? site.sections
      : [
          { type: "about" },
          { type: "stats" },
          { type: "services" },
          { type: "portfolio" },
          { type: "testimonials" },
          { type: "cta" },
        ];

  return (
    <div
      className={cn(
        activeTheme === "dark" ? "theme-dark dark" : "theme-light",
        "min-h-screen bg-background text-foreground"
      )}
    >
      <SiteNav site={site} theme={activeTheme} onToggleTheme={toggleTheme} />
      <div ref={heroRef}>
        <Hero site={site} y={y} opacity={opacity} />
      </div>
      {sections.map((section, i) => {
        const Renderer = SECTION_REGISTRY[section.type];
        if (!Renderer) return null;
        return <Renderer key={`${section.type}-${i}`} site={site} section={section} />;
      })}
    </div>
  );
}
