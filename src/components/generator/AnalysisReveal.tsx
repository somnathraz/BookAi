"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  ImageOff,
  Moon,
  Quote,
  Sparkles,
  Sun,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "@/components/generator/PhotoUpload";
import { deriveArchetype, suggestCareerStage } from "@/lib/compose";
import type {
  AnalysisResult,
  Archetype,
  BusinessDomain,
  CareerStage,
  GeneratorInput,
  ThemeMode,
} from "@/lib/types";

const EASE = [0.22, 1, 0.36, 1] as const;

// The user explicitly picks the shape of the site so a resume can become an
// experience-led profile OR a work-led portfolio — never a services page by
// accident. Each option maps 1:1 to the section ordering in lib/compose.ts.
const ARCHETYPE_OPTIONS: {
  id: Archetype;
  label: string;
  blurb: string;
}[] = [
  {
    id: "profile",
    label: "Personal profile",
    blurb: "About you + an experience timeline. Best for a CV / résumé.",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    blurb: "Leads with your work & projects. Best for makers & creatives.",
  },
  {
    id: "business",
    label: "Business",
    blurb: "Services, photos & reviews. Best for a practice or local shop.",
  },
];

const CAREER_STAGE_OPTIONS: {
  id: CareerStage;
  label: string;
  blurb: string;
}[] = [
  {
    id: "early-career",
    label: "Early career",
    blurb: "Puts projects, education and credentials first.",
  },
  {
    id: "experienced",
    label: "Experienced",
    blurb: "Puts career progression and impact first.",
  },
];

const PRESET_ACCENTS = [
  "#6366f1", "#8b5cf6", "#3b82f6", "#0ea5e9",
  "#14b8a6", "#10b981", "#f59e0b", "#f43f5e",
];

const SOURCE_LABEL: Record<AnalysisResult["source"], string> = {
  resume: "your resume",
  maps: "your Google Business",
  competitor: "that site",
  linkedin: "your LinkedIn",
  manual: "your details",
};

function Section({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#214f43] dark:text-[#9cc2b3]">
      {children}
    </span>
  );
}

export function AnalysisReveal({
  analysis,
  onBack,
  onConfirm,
}: {
  analysis: AnalysisResult;
  onBack: () => void;
  onConfirm: (values: Partial<GeneratorInput>) => void;
}) {
  const [domain, setDomain] = useState<BusinessDomain>(
    analysis.categories[0]?.domain ?? analysis.profile.domain ?? "other"
  );
  const [accent, setAccent] = useState<string | null>(
    analysis.palette[0] ?? null
  );
  const [theme, setTheme] = useState<ThemeMode>(analysis.profile.theme ?? "light");
  const [photo, setPhoto] = useState<string | null>(analysis.profile.photo ?? null);
  const [archetype, setArchetype] = useState<Archetype>(
    deriveArchetype(domain, analysis.source)
  );
  const [careerStage, setCareerStage] = useState<CareerStage>(
    analysis.profile.careerStage ??
      suggestCareerStage({
        work: analysis.profile.work,
        projects: analysis.profile.projects,
      })
  );
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  const accents = useMemo(() => {
    const fromImages = analysis.palette.filter((c) => /^#?[0-9a-f]{3,8}$/i.test(c));
    return [...new Set([...fromImages, ...PRESET_ACCENTS])].slice(0, 10);
  }, [analysis.palette]);

  const allImages = analysis.images.filter(Boolean);
  const images = allImages.filter((src) => !broken[src]);
  const previewImages = images.slice(0, 12);
  const morePhotoCount = Math.max(0, images.length - previewImages.length);
  const serviceCount = analysis.profile.services?.length ?? 0;

  function confirm() {
    // For business sites the found photos become the gallery; profile/portfolio
    // never get a generic gallery so the experience/work stays the focus.
    const gallery =
      archetype === "business" ? allImages.slice(0, 20) : [];
    onConfirm({
      ...analysis.profile,
      source: analysis.source,
      domain,
      theme,
      accent: accent ?? undefined,
      photo: photo ?? undefined,
      archetype,
      careerStage: archetype === "profile" ? careerStage : undefined,
      gallery,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-0 overflow-hidden rounded-[1.5rem] border border-[#11130f]/10 bg-white/75 shadow-[0_30px_80px_-55px_rgba(17,19,15,0.5)] dark:border-white/10 dark:bg-[#151815]/90">
      <Section>
        <div className="flex items-start justify-between gap-4 border-b border-[#11130f]/10 p-5 dark:border-white/10 sm:p-7">
          <div className="min-w-0">
            <Eyebrow>Review your import</Eyebrow>
            <div className="mt-2 flex min-w-0 items-start gap-2">
              <Sparkles className="mt-1 size-4 shrink-0 text-[#214f43] dark:text-[#9cc2b3]" />
              <h2 className="text-balance text-2xl font-semibold tracking-[-0.025em] text-[#11130f] dark:text-stone-50 sm:text-3xl">
                We found this in {SOURCE_LABEL[analysis.source]}
              </h2>
            </div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500 dark:text-stone-400">Choose what to keep. Nothing is published until you approve the finished website.</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="flex shrink-0 items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-[#11130f] dark:text-stone-400 dark:hover:text-white"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Change source</span>
          </button>
        </div>
      </Section>

      {/* Images / photos */}
      <Section delay={0.08} className="min-w-0 border-b border-[#11130f]/10 p-5 dark:border-white/10 sm:p-7">
        <Eyebrow>{analysis.source === "maps" ? "Photos" : "Imagery"}</Eyebrow>
        {previewImages.length ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {previewImages.map((src) => {
              const active = photo === src;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => setPhoto(active ? null : src)}
                  className={cn(
                    "group relative aspect-square min-w-0 overflow-hidden rounded-xl border-2 transition-all",
                    active ? "border-[#214f43] dark:border-[#9cc2b3]" : "border-[#11130f]/10 hover:border-[#214f43]/40 dark:border-white/10 dark:hover:border-[#9cc2b3]/40"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() => setBroken((b) => ({ ...b, [src]: true }))}
                    className="size-full object-cover"
                  />
                  {active ? (
                    <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-[#214f43] text-white dark:bg-[#9cc2b3] dark:text-[#0d0f0d]">
                      <Check className="size-3" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
        {morePhotoCount > 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            +{morePhotoCount} more photo{morePhotoCount === 1 ? "" : "s"} on your
            generated site ({images.length} total)
          </p>
        ) : null}
        {!previewImages.length ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-[#11130f]/15 bg-[#f3f3ef] px-4 py-3 text-sm text-stone-500 dark:border-white/15 dark:bg-white/[0.03] dark:text-stone-400">
            <ImageOff className="size-5 shrink-0" />
            <span>
              Resumes &amp; LinkedIn don&apos;t expose a photo — add yours below and
              we&apos;ll feature it on your site.
            </span>
          </div>
        ) : null}
        <div className="mt-4">
          <PhotoUpload
            value={photo}
            onChange={setPhoto}
            label={previewImages.length ? "Or upload your own" : "Upload your photo"}
          />
        </div>
      </Section>

      {/* Category */}
      <Section delay={0.16} className="min-w-0 border-b border-[#11130f]/10 p-5 dark:border-white/10 sm:p-7">
        <Eyebrow>We think you&apos;re a…</Eyebrow>
        <div className="mt-3 flex flex-wrap gap-2">
          {analysis.categories.map((c) => {
            const active = c.domain === domain;
            return (
              <button
                key={c.domain}
                type="button"
                onClick={() => setDomain(c.domain)}
                className={cn(
                  "flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors sm:px-4",
                  active
                    ? "border-[#214f43] bg-[#214f43] text-white dark:border-[#9cc2b3] dark:bg-[#9cc2b3] dark:text-[#0d0f0d]"
                    : "border-[#11130f]/15 hover:border-[#214f43]/40 hover:bg-[#dce8e2]/60 dark:border-white/15 dark:hover:border-[#9cc2b3]/40 dark:hover:bg-[#214f43]/15"
                )}
              >
                {active && <Check className="size-3.5 shrink-0" />}
                <span className="truncate">{c.label}</span>
                <span
                  className={cn(
                    "shrink-0 text-xs",
                    active ? "text-background/60" : "text-muted-foreground"
                  )}
                >
                  {Math.round(c.confidence * 100)}%
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Site type (archetype) — the user decides the shape */}
      <Section delay={0.2} className="border-b border-[#11130f]/10 p-5 dark:border-white/10 sm:p-7">
        <Eyebrow>What kind of site?</Eyebrow>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {ARCHETYPE_OPTIONS.map((opt) => {
            const active = archetype === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setArchetype(opt.id)}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors",
                  active
                    ? "border-[#214f43] bg-[#dce8e2] dark:border-[#9cc2b3] dark:bg-[#214f43]/20"
                    : "border-[#11130f]/15 hover:border-[#214f43]/40 hover:bg-[#f3f3ef] dark:border-white/15 dark:hover:border-[#9cc2b3]/40 dark:hover:bg-white/[0.04]"
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  {active && <Check className="size-3.5" />}
                  {opt.label}
                </span>
                <span className="text-xs leading-snug text-muted-foreground">
                  {opt.blurb}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {(analysis.source === "resume" || analysis.source === "linkedin") && archetype === "profile" ? (
        <Section delay={0.22} className="border-b border-[#11130f]/10 p-5 dark:border-white/10 sm:p-7">
          <Eyebrow>How should your profile lead?</Eyebrow>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            We suggested a layout from the roles we found. You can switch it anytime.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {CAREER_STAGE_OPTIONS.map((option) => {
              const active = careerStage === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCareerStage(option.id)}
                  className={cn(
                    "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
                    active
                      ? "border-[#214f43] bg-[#dce8e2] dark:border-[#9cc2b3] dark:bg-[#214f43]/20"
                      : "border-[#11130f]/15 hover:border-[#214f43]/40 hover:bg-[#f3f3ef] dark:border-white/15 dark:hover:border-[#9cc2b3]/40 dark:hover:bg-white/[0.04]"
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {active && <Check className="size-3.5" />}
                    {option.label}
                  </span>
                  <span className="text-xs leading-snug text-muted-foreground">{option.blurb}</span>
                </button>
              );
            })}
          </div>
        </Section>
      ) : null}

      {/* Accent + theme */}
      <Section delay={0.28} className="border-b border-[#11130f]/10 p-5 dark:border-white/10 sm:p-7">
        <Eyebrow>Theme</Eyebrow>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {accents.map((c) => {
            const hex = c.startsWith("#") ? c : `#${c}`;
            const active = accent === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setAccent(c)}
                aria-label={`Accent ${hex}`}
                className={cn(
                  "size-8 rounded-full border-2 transition-transform hover:scale-110",
                  active ? "border-foreground scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: hex }}
              />
            );
          })}
          <button
            type="button"
            onClick={() => setAccent(null)}
            className={cn(
              "flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors",
              accent === null
                ? "border-[#214f43] bg-[#214f43] text-white dark:border-[#9cc2b3] dark:bg-[#9cc2b3] dark:text-[#0d0f0d]"
                : "border-[#11130f]/15 hover:bg-[#f3f3ef] dark:border-white/15 dark:hover:bg-white/[0.04]"
            )}
          >
            Neutral
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          {(["light", "dark"] as ThemeMode[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium capitalize transition-colors",
                theme === t
                  ? "border-[#214f43] bg-[#214f43] text-white dark:border-[#9cc2b3] dark:bg-[#9cc2b3] dark:text-[#0d0f0d]"
                  : "border-[#11130f]/15 hover:bg-[#f3f3ef] dark:border-white/15 dark:hover:bg-white/[0.04]"
              )}
            >
              {t === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {t}
            </button>
          ))}
        </div>
      </Section>

      {/* Signals */}
      {(analysis.certifications.length ||
        analysis.reviews.length ||
        serviceCount) ? (
        <Section delay={0.32} className="border-b border-[#11130f]/10 p-5 dark:border-white/10 sm:p-7">
          <Eyebrow>Signals found</Eyebrow>
          <div className="mt-3 flex flex-col gap-3">
            {analysis.certifications.length ? (
              <div className="flex flex-wrap items-center gap-2">
                <Award className="size-4 text-muted-foreground" />
                {analysis.certifications.slice(0, 6).map((c) => (
                  <Badge key={c} variant="secondary" className="rounded-full font-normal">
                    {c}
                  </Badge>
                ))}
              </div>
            ) : null}
            {analysis.reviews.length ? (
              <div className="flex min-w-0 items-start gap-2 rounded-xl border border-[#11130f]/10 bg-[#f3f3ef] p-4 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                <Quote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 break-words text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {analysis.reviews.length} review
                    {analysis.reviews.length > 1 ? "s" : ""}
                  </span>{" "}
                  pulled in — e.g. &ldquo;{analysis.reviews[0].quote.slice(0, 90)}
                  {analysis.reviews[0].quote.length > 90 ? "…" : ""}&rdquo;
                </span>
              </div>
            ) : null}
            {serviceCount ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{serviceCount}</span>{" "}
                services detected — you can edit them next.
              </p>
            ) : null}
          </div>
        </Section>
      ) : null}

      <Section delay={0.4} className="p-5 sm:p-7">
        <Button size="lg" className="h-12 w-full bg-[#214f43] text-white hover:bg-[#173b32] dark:bg-[#9cc2b3] dark:text-[#0d0f0d] dark:hover:bg-[#b9d5ca]" onClick={confirm}>
          Looks right — review details
          <ArrowRight className="size-4" />
        </Button>
      </Section>
    </div>
  );
}
