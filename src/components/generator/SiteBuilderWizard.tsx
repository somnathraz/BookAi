"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Camera,
  Check,
  ChevronDown,
  Code2,
  Dumbbell,
  LayoutGrid,
  Loader2,
  Maximize2,
  Monitor,
  Moon,
  Palette,
  Sparkles,
  Stethoscope,
  Smartphone,
  Sun,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/generator/PhotoUpload";
import { VisualKitPicker } from "@/components/generator/VisualKitPicker";
import { GeneratedSite } from "@/components/generated/GeneratedSite";
import { deriveArchetype } from "@/lib/compose";
import { generateSite } from "@/lib/template";
import { DOMAIN_ACCENT } from "@/lib/template";
import {
  ARCHETYPE_META,
  ARCHETYPE_PREVIEW_SECTIONS,
  DOMAIN_META,
  PRESET_ACCENTS,
  WIZARD_STEPS,
} from "@/lib/site-builder-meta";
import { siteStyle, styleThemeToKit } from "@/lib/site-style";
import type {
  Archetype,
  BusinessDomain,
  GeneratorInput,
  ThemeMode,
  VisualKit,
} from "@/lib/types";

const EASE = [0.22, 1, 0.36, 1] as const;

const DOMAIN_ICONS: Record<string, LucideIcon> = {
  Code2,
  Palette,
  Stethoscope,
  Briefcase,
  Camera,
  UtensilsCrossed,
  Dumbbell,
  Sparkles,
};

interface Row {
  a: string;
  b: string;
  c?: string;
}

function padRows(rows: Row[], min: number, empty: Row): Row[] {
  const out = [...rows];
  while (out.length < min) out.push({ ...empty });
  return out;
}

function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-1 sm:gap-2">
      {WIZARD_STEPS.map((s, i) => {
        const done = step > s.id;
        const active = step === s.id;
        return (
          <li key={s.id} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
            {i > 0 ? (
              <span
                className={cn(
                  "hidden h-px flex-1 sm:block",
                  done || active ? "bg-[#214f43]/45 dark:bg-[#9cc2b3]/45" : "bg-[#11130f]/10 dark:bg-white/10"
                )}
              />
            ) : null}
            <div
              className={cn(
                "flex min-w-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm",
                active
                  ? "border-[#214f43] bg-[#214f43] text-white dark:border-[#9cc2b3] dark:bg-[#9cc2b3] dark:text-[#0d0f0d]"
                  : done
                    ? "border-[#214f43]/20 bg-[#dce8e2] text-[#214f43] dark:border-[#9cc2b3]/20 dark:bg-[#214f43]/20 dark:text-[#9cc2b3]"
                    : "border-[#11130f]/10 text-stone-500 dark:border-white/10 dark:text-stone-400"
              )}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] sm:text-xs">
                {done ? <Check className="size-3" /> : s.id}
              </span>
              <span className="hidden truncate sm:inline">{s.title}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function LivePreviewPanel({
  archetype,
  domain,
  domainLabel,
  theme,
  visualKit,
  accent,
  name,
  onOpenPreview,
}: {
  archetype: Archetype;
  domain: BusinessDomain;
  domainLabel: string;
  theme: ThemeMode;
  visualKit: VisualKit | undefined;
  accent?: string;
  name: string;
  onOpenPreview: () => void;
}) {
  const sections = ARCHETYPE_PREVIEW_SECTIONS[archetype];
  const kit = visualKit ?? styleThemeToKit("minimal");
  const st = siteStyle({
    visualKit: kit,
    styleTheme: "minimal",
    density: "comfortable",
    variants: {},
  });
  const archetypeMeta = ARCHETYPE_META.find((a) => a.id === archetype);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#111311] p-4 text-stone-50 shadow-[0_26px_60px_-35px_rgba(17,19,15,0.75)]"
      )}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9cc2b3]">
        <LayoutGrid className="size-3.5" />
        Your site preview
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-lg border shadow-sm",
          theme === "dark" ? "border-white/10 bg-zinc-900" : "border-white/10 bg-[#f7f7f3] text-zinc-900"
        )}
      >
        {/* Mini browser chrome */}
        <div className="flex items-center gap-1.5 border-b px-3 py-2">
          <span className="size-2 rounded-full bg-current opacity-20" />
          <span className="size-2 rounded-full bg-current opacity-20" />
          <span className="size-2 rounded-full bg-current opacity-20" />
          <span className="ml-2 truncate text-[10px] text-muted-foreground">
            {name.trim() || "your-name"}.paperchai.com
          </span>
        </div>

        <div className="space-y-2 p-3">
          {/* Hero mock */}
          <div className="rounded-md border border-dashed border-border/80 p-3">
            <span className={cn("text-[10px] text-muted-foreground", st.eyebrow)}>
              HERO
            </span>
            <p className={cn("mt-1 text-sm", st.heading)}>
              {name.trim() || "Your headline"}
            </p>
            <span
              className={cn(
                "mt-2 inline-block px-2 py-0.5 text-[9px] font-medium text-white",
                st.ctaRadius
              )}
              style={{ backgroundColor: accent ?? DOMAIN_ACCENT[domain] }}
            >
              Get in touch
            </span>
          </div>

          {/* Section stack */}
          {sections.map((sec) => (
            <div
              key={sec.type}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-[10px]",
                st.card
              )}
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: accent ?? DOMAIN_ACCENT[domain] }}
              />
              <span className="font-medium">{sec.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          <span className="font-medium text-stone-100">{archetypeMeta?.label}</span>
          {" · "}
          {domainLabel}
        </p>
        <p>
          {visualKit ? `${visualKit} style` : "Best-fit style"} · {theme} mode
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenPreview}
        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm font-medium text-stone-100 transition hover:bg-white/[0.1]"
      >
        <Maximize2 className="size-4 text-[#9cc2b3]" />
        Open full preview
      </button>
    </div>
  );
}

export function SiteBuilderWizard({
  onGenerate,
  generating,
  error,
  initialValues,
  aiAvailable = false,
  editMode = false,
  initialStep = 1,
}: {
  onGenerate: (input: GeneratorInput) => void;
  generating: boolean;
  error: string | null;
  initialValues?: Partial<GeneratorInput>;
  aiAvailable?: boolean;
  editMode?: boolean;
  initialStep?: 1 | 2 | 3;
}) {
  const iv = initialValues ?? {};
  const [step, setStep] = useState<number>(initialStep);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [archetypeTouched, setArchetypeTouched] = useState(Boolean(iv.archetype));

  const [useAI, setUseAI] = useState(true);
  const [name, setName] = useState(iv.name ?? "");
  const [domain, setDomain] = useState<BusinessDomain>(iv.domain ?? "developer");
  const [archetype, setArchetype] = useState<Archetype>(
    iv.archetype ?? deriveArchetype(iv.domain ?? "developer")
  );
  const [theme, setTheme] = useState<ThemeMode>(iv.theme ?? "light");
  const [visualKit, setVisualKit] = useState<VisualKit | undefined>(iv.visualKit);
  const [accent, setAccent] = useState<string | null>(
    iv.accent ?? DOMAIN_ACCENT[iv.domain ?? "developer"] ?? null
  );
  const [tagline, setTagline] = useState(iv.tagline ?? "");
  const [bio, setBio] = useState(iv.bio ?? "");
  const [location, setLocation] = useState(iv.location ?? "");
  const [email, setEmail] = useState(iv.email ?? "");
  const [phone, setPhone] = useState(iv.phone ?? "");
  const [photo, setPhoto] = useState<string | null>(iv.photo ?? null);
  const [whatsapp, setWhatsapp] = useState(iv.socials?.whatsapp ?? "");
  const [github, setGithub] = useState(iv.socials?.github ?? "");
  const [linkedin, setLinkedin] = useState(iv.socials?.linkedin ?? "");
  const [instagram, setInstagram] = useState(iv.socials?.instagram ?? "");
  const [website, setWebsite] = useState(iv.socials?.website ?? "");
  const [showSocial, setShowSocial] = useState(false);
  const [showExtras, setShowExtras] = useState(
    Boolean(iv.services?.length || iv.testimonials?.length)
  );
  const [services, setServices] = useState<Row[]>(() =>
    padRows(
      (iv.services ?? []).map((s) => ({ a: s.title, b: s.description ?? "" })),
      3,
      { a: "", b: "" }
    )
  );
  const [testimonials, setTestimonials] = useState<Row[]>(() =>
    padRows(
      (iv.testimonials ?? []).map((t) => ({
        a: t.quote,
        b: t.author,
        c: t.role ?? "",
      })),
      2,
      { a: "", b: "", c: "" }
    )
  );

  const domainLabel = useMemo(
    () => DOMAIN_META.find((d) => d.value === domain)?.label ?? domain,
    [domain]
  );

  const accentSwatches = useMemo(() => {
    const fromIv = iv.accent ? [iv.accent] : [];
    return [...new Set([...fromIv, ...PRESET_ACCENTS])].slice(0, 10);
  }, [iv.accent]);

  function pickDomain(next: BusinessDomain) {
    setDomain(next);
    if (!accent || accent === DOMAIN_ACCENT[domain]) {
      setAccent(DOMAIN_ACCENT[next]);
    }
    if (!archetypeTouched) {
      setArchetype(deriveArchetype(next));
    }
  }

  function pickArchetype(next: Archetype) {
    setArchetypeTouched(true);
    setArchetype(next);
  }

  function updateRow(
    rows: Row[],
    setRows: (r: Row[]) => void,
    i: number,
    key: keyof Row,
    value: string
  ) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }

  function buildInput(): GeneratorInput {
    return {
      source: iv.source,
      name: name.trim(),
      domain,
      theme,
      tagline: tagline.trim() || undefined,
      bio: bio.trim() || undefined,
      location: location.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      services: services
        .filter((r) => r.a.trim())
        .map((r) => ({ title: r.a.trim(), description: r.b.trim() || undefined })),
      testimonials: testimonials
        .filter((r) => r.a.trim() && r.b.trim())
        .map((r) => {
          const orig = (iv.testimonials ?? []).find(
            (t) => t.quote.trim() === r.a.trim()
          );
          return {
            quote: r.a.trim(),
            author: r.b.trim(),
            role: r.c?.trim() || undefined,
            rating: orig?.rating,
            verified: orig?.verified,
          };
        }),
      accent: accent ?? undefined,
      visualKit,
      photo: photo ?? undefined,
      socials: {
        whatsapp: whatsapp.trim() || undefined,
        github: github.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        instagram: instagram.trim() || undefined,
        website: website.trim() || undefined,
      },
      archetype,
      gallery: archetype === "business" ? iv.gallery : [],
      storeHours: archetype === "business" ? iv.storeHours : undefined,
      mapEmbedUrl: archetype === "business" ? iv.mapEmbedUrl : undefined,
      mapsUrl: archetype === "business" ? iv.mapsUrl : undefined,
      work: iv.work,
      projects: iv.projects,
      skills: iv.skills,
      certifications: iv.certifications,
      languages: iv.languages,
      interests: iv.interests,
      useAI: aiAvailable ? useAI : false,
    };
  }

  function handleGenerate() {
    if (!name.trim() || generating) return;
    onGenerate(buildInput());
  }

  const canNext = step === 1 || step === 2;
  const canGenerate = step === 3 && name.trim().length > 0;
  const previewSite = previewOpen
    ? generateSite({ ...buildInput(), name: name.trim() || "Your business" })
    : null;

  useEffect(() => {
    const current = window.history.state ?? {};
    window.history.replaceState(
      { ...current, paperchaiBuilder: true, builderStep: initialStep },
      ""
    );

    function onPopState(event: PopStateEvent) {
      const historyStep = Number(event.state?.builderStep);
      if (event.state?.paperchaiBuilder && historyStep >= 1 && historyStep <= 3) {
        setStep(historyStep);
      }
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [initialStep]);

  useEffect(() => {
    if (!previewOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [previewOpen]);

  function moveToStep(nextStep: number) {
    const boundedStep = Math.max(1, Math.min(3, nextStep));
    const current = window.history.state ?? {};
    window.history.pushState(
      { ...current, paperchaiBuilder: true, builderStep: boundedStep },
      ""
    );
    setStep(boundedStep);
  }

  function moveBack() {
    if (step <= 1) return;
    if (initialStep > 1 && step <= initialStep) {
      const previousStep = step - 1;
      const current = window.history.state ?? {};
      window.history.replaceState(
        { ...current, paperchaiBuilder: true, builderStep: previousStep },
        ""
      );
      setStep(previousStep);
      return;
    }
    const current = window.history.state;
    if (current?.paperchaiBuilder) {
      window.history.back();
      return;
    }
    setStep((currentStep) => Math.max(1, currentStep - 1));
  }

  return (
    <>
    <div className="w-full min-w-0 overflow-x-hidden rounded-[1.5rem] border border-[#11130f]/10 bg-white/80 shadow-[0_30px_80px_-55px_rgba(17,19,15,0.5)] backdrop-blur dark:border-white/10 dark:bg-[#151815]/90">
      {/* Wizard header */}
      <div className="border-b border-[#11130f]/10 px-4 py-4 sm:px-7 sm:py-5 dark:border-white/10">
        <StepIndicator step={step} />
        <p className="mt-3 text-sm text-muted-foreground">
          {WIZARD_STEPS[step - 1]?.subtitle}
        </p>
      </div>

      <div className="grid gap-7 p-4 sm:p-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main step content */}
        <div className="min-w-0 overflow-x-hidden">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h3 className="text-lg font-semibold">What kind of site?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pick the shape — each option shows the sections you&apos;ll get.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {ARCHETYPE_META.map((opt) => {
                      const active = archetype === opt.id;
                      const preview = ARCHETYPE_PREVIEW_SECTIONS[opt.id];
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => pickArchetype(opt.id)}
                          className={cn(
                            "flex flex-col gap-3 rounded-xl border p-3 text-left transition-all hover:scale-[1.01]",
                            active
                              ? "border-[#214f43] bg-[#dce8e2] ring-2 ring-[#214f43]/10 dark:border-[#9cc2b3] dark:bg-[#214f43]/20"
                              : "border-[#11130f]/10 hover:border-[#214f43]/35 hover:bg-[#f3f3ef] dark:border-white/10 dark:hover:border-[#9cc2b3]/35 dark:hover:bg-white/[0.04]"
                          )}
                        >
                          <div className="space-y-1">
                            <span className="flex items-center gap-1.5 text-sm font-semibold">
                              {active && <Check className="size-3.5" />}
                              {opt.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {opt.bestFor}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="h-6 rounded border border-dashed border-border/80 bg-muted/50 px-2 text-[9px] leading-6 text-muted-foreground">
                              Hero
                            </div>
                            {preview.slice(0, 4).map((s) => (
                              <div
                                key={s.type}
                                className="rounded border bg-background/80 px-2 py-1 text-[9px] font-medium"
                              >
                                {s.label}
                              </div>
                            ))}
                            {preview.length > 4 ? (
                              <span className="text-[9px] text-muted-foreground">
                                +{preview.length - 4} more
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Your profession</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We tailor copy, icons and defaults to your field.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {DOMAIN_META.map((d) => {
                      const active = domain === d.value;
                      const Icon = DOMAIN_ICONS[d.icon] ?? Sparkles;
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => pickDomain(d.value)}
                          className={cn(
                            "flex min-w-0 flex-col items-center gap-2 rounded-xl border p-2.5 text-center transition-all hover:scale-[1.02] sm:p-3",
                            active
                              ? "border-[#214f43] bg-[#dce8e2] ring-2 ring-[#214f43]/10 dark:border-[#9cc2b3] dark:bg-[#214f43]/20"
                              : "border-[#11130f]/10 hover:border-[#214f43]/35 hover:bg-[#f3f3ef] dark:border-white/10 dark:hover:border-[#9cc2b3]/35 dark:hover:bg-white/[0.04]"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-full sm:size-10",
                              active ? "bg-[#214f43] text-white dark:bg-[#9cc2b3] dark:text-[#0d0f0d]" : "bg-[#ecece7] dark:bg-white/[0.06]"
                            )}
                          >
                            <Icon className="size-4 sm:size-5" />
                          </span>
                          <span className="w-full truncate text-xs font-semibold">{d.label}</span>
                          <span className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                            {d.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : null}

            {step === 2 ? (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h3 className="text-lg font-semibold">Light or dark?</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {(["light", "dark"] as ThemeMode[]).map((t) => {
                      const active = theme === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTheme(t)}
                          className={cn(
                            "flex flex-col gap-2 rounded-xl border p-3 transition-all",
                            active
                              ? "border-[#214f43] bg-[#dce8e2] ring-2 ring-[#214f43]/10 dark:border-[#9cc2b3] dark:bg-[#214f43]/20"
                              : "border-[#11130f]/10 hover:border-[#214f43]/35 hover:bg-[#f3f3ef] dark:border-white/10 dark:hover:border-[#9cc2b3]/35 dark:hover:bg-white/[0.04]"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-16 items-center justify-center rounded-lg",
                              t === "light" ? "bg-white text-zinc-900" : "bg-zinc-900 text-white"
                            )}
                          >
                            {t === "light" ? (
                              <Sun className="size-6" />
                            ) : (
                              <Moon className="size-6" />
                            )}
                          </div>
                          <span className="flex items-center justify-center gap-1.5 text-sm font-medium capitalize">
                            {active && <Check className="size-3.5" />}
                            {t}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Brand accent</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Used on buttons, badges and highlights across your site.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {accentSwatches.map((c) => {
                      const hex = c.startsWith("#") ? c : `#${c}`;
                      const active = accent === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAccent(c)}
                          aria-label={`Accent ${hex}`}
                          className={cn(
                            "size-9 rounded-full border-2 transition-transform hover:scale-110",
                            active ? "scale-110 border-foreground" : "border-transparent"
                          )}
                          style={{ backgroundColor: hex }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Visual style</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Each preview shows exactly how cards and buttons will look.
                  </p>
                  <div className="mt-4">
                    <VisualKitPicker
                      value={visualKit}
                      onChange={setVisualKit}
                      accent={accent ?? undefined}
                    />
                  </div>
                </div>
              </motion.div>
            ) : null}

            {step === 3 ? (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="flex flex-col gap-5"
              >
                <div>
                  <h3 className="text-lg font-semibold">Name or business</h3>
                  <Input
                    className="mt-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Meera Rao, or Rao Dental Clinic"
                    autoFocus
                  />
                </div>

                <PhotoUpload
                  value={photo}
                  onChange={setPhoto}
                  hint="Optional — featured in your hero"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Tagline</span>
                    <Input
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="One line that captures what you do"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-sm font-medium">About</span>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="A few sentences — or leave blank and we'll write it"
                      rows={3}
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Location</span>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Bengaluru, IN"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Email</span>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Phone</span>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 ..."
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSocial((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg border bg-card/40 px-4 py-3 text-left text-sm font-medium"
                >
                  Social links
                  <ChevronDown
                    className={cn("size-4 transition-transform", showSocial && "rotate-180")}
                  />
                </button>
                {showSocial ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="WhatsApp"
                    />
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="Website"
                    />
                    <Input
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="GitHub"
                    />
                    <Input
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="LinkedIn"
                    />
                    <Input
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="Instagram"
                    />
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setShowExtras((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg border bg-card/40 px-4 py-3 text-left text-sm font-medium"
                >
                  Services & testimonials
                  <ChevronDown
                    className={cn("size-4 transition-transform", showExtras && "rotate-180")}
                  />
                </button>
                {showExtras ? (
                  <div className="flex flex-col gap-4">
                    {services.map((row, i) => (
                      <div key={i} className="grid gap-2 sm:grid-cols-2">
                        <Input
                          value={row.a}
                          onChange={(e) =>
                            updateRow(services, setServices, i, "a", e.target.value)
                          }
                          placeholder={`Service ${i + 1}`}
                        />
                        <Input
                          value={row.b}
                          onChange={(e) =>
                            updateRow(services, setServices, i, "b", e.target.value)
                          }
                          placeholder="Description"
                        />
                      </div>
                    ))}
                    {testimonials.map((row, i) => (
                      <div key={i} className="grid gap-2 sm:grid-cols-3">
                        <Input
                          value={row.a}
                          onChange={(e) =>
                            updateRow(testimonials, setTestimonials, i, "a", e.target.value)
                          }
                          placeholder="Quote"
                          className="sm:col-span-2"
                        />
                        <Input
                          value={row.b}
                          onChange={(e) =>
                            updateRow(testimonials, setTestimonials, i, "b", e.target.value)
                          }
                          placeholder="Author"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}

                {aiAvailable ? (
                  <button
                    type="button"
                    onClick={() => setUseAI((v) => !v)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 p-4 text-left transition-colors hover:bg-card"
                  >
                    <span className="flex items-start gap-3">
                      <Sparkles className="mt-0.5 size-5" />
                      <span>
                        <span className="block text-sm font-medium">AI writes your copy</span>
                        <span className="block text-xs text-muted-foreground">
                          {useAI
                            ? "Tailored tagline, sections and CTA from your details."
                            : "Off — use profession template only."}
                        </span>
                      </span>
                    </span>
                    <span
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                        useAI ? "bg-foreground" : "bg-input"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block size-5 rounded-full bg-background transition-transform",
                          useAI ? "translate-x-[22px]" : "translate-x-0.5"
                        )}
                      />
                    </span>
                  </button>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        </div>

        {/* Live preview — sticky on desktop, compact on mobile */}
        <div className="min-w-0 lg:sticky lg:top-4 lg:self-start">
          <LivePreviewPanel
            archetype={archetype}
            domain={domain}
            domainLabel={domainLabel}
            theme={theme}
            visualKit={visualKit}
            accent={accent ?? undefined}
            name={name}
            onOpenPreview={() => setPreviewOpen(true)}
          />
        </div>
      </div>

      {/* Footer nav */}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t border-[#11130f]/10 bg-white/95 px-4 py-4 backdrop-blur sm:gap-3 sm:px-7 dark:border-white/10 dark:bg-[#151815]/95">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="sm:h-9 sm:px-4 sm:text-sm"
          disabled={step === 1}
          onClick={moveBack}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {step < 3 ? (
          <Button
            type="button"
            size="sm"
            className="bg-[#214f43] text-white hover:bg-[#173b32] sm:h-9 sm:px-4 sm:text-sm dark:bg-[#9cc2b3] dark:text-[#0d0f0d] dark:hover:bg-[#b9d5ca]"
            disabled={!canNext}
            onClick={() => moveToStep(step + 1)}
          >
            Continue
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="max-w-full bg-[#214f43] text-white hover:bg-[#173b32] sm:h-10 sm:px-6 sm:text-sm dark:bg-[#9cc2b3] dark:text-[#0d0f0d] dark:hover:bg-[#b9d5ca]"
            disabled={!canGenerate || generating}
            onClick={handleGenerate}
          >
            {generating ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin" />
                <span className="truncate">
                  {editMode
                    ? aiAvailable && useAI
                      ? "Updating…"
                      : "Saving…"
                    : aiAvailable && useAI
                      ? "Writing…"
                      : "Generating…"}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="size-4 shrink-0" />
                <span className="truncate">
                  {editMode ? "Save & publish" : "Update preview"}
                </span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
      <AnimatePresence>
        {previewOpen && previewSite ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex min-w-0 flex-col bg-[#0d0f0d]"
            role="dialog"
            aria-modal="true"
            aria-label="Full website preview"
          >
            <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 text-stone-100 sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Website preview</p>
                <p className="hidden text-xs text-stone-400 sm:block">
                  Layout and typography are exact. AI may refine the copy after generation.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl border border-white/10 bg-white/[0.05] p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    aria-label="Desktop preview"
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg transition",
                      previewDevice === "desktop"
                        ? "bg-[#9cc2b3] text-[#0d0f0d]"
                        : "text-stone-400 hover:text-white"
                    )}
                  >
                    <Monitor className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    aria-label="Mobile preview"
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg transition",
                      previewDevice === "mobile"
                        ? "bg-[#9cc2b3] text-[#0d0f0d]"
                        : "text-stone-400 hover:text-white"
                    )}
                  >
                    <Smartphone className="size-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-stone-300 transition hover:bg-white/[0.08] hover:text-white"
                  aria-label="Close preview"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#e8e8e3] p-0 sm:p-5">
              <div
                className={cn(
                  "mx-auto min-h-full overflow-hidden bg-background shadow-[0_35px_100px_-45px_rgba(0,0,0,0.75)] transition-[max-width,border-radius] duration-300",
                  previewDevice === "mobile"
                    ? "max-w-[390px] sm:rounded-[1.5rem]"
                    : "max-w-7xl sm:rounded-[1.5rem]"
                )}
              >
                <GeneratedSite
                  site={previewSite}
                  theme={theme}
                  onThemeChange={setTheme}
                  showBranding={false}
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
