"use client";

import { useMemo, useState } from "react";
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
  Moon,
  Palette,
  Sparkles,
  Stethoscope,
  Sun,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/generator/PhotoUpload";
import { VisualKitPicker } from "@/components/generator/VisualKitPicker";
import { deriveArchetype } from "@/lib/compose";
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
                  done || active ? "bg-foreground/40" : "bg-border"
                )}
              />
            ) : null}
            <div
              className={cn(
                "flex min-w-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm",
                active
                  ? "border-foreground bg-foreground text-background"
                  : done
                    ? "border-foreground/30 bg-accent text-foreground"
                    : "border-input text-muted-foreground"
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
}: {
  archetype: Archetype;
  domain: BusinessDomain;
  domainLabel: string;
  theme: ThemeMode;
  visualKit: VisualKit | undefined;
  accent?: string;
  name: string;
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
        "flex flex-col gap-4 rounded-xl border p-4",
        theme === "dark" ? "bg-zinc-950 text-zinc-50" : "bg-muted/30"
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <LayoutGrid className="size-3.5" />
        Your site preview
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-lg border shadow-sm",
          theme === "dark" ? "border-white/10 bg-zinc-900" : "border-border bg-background"
        )}
      >
        {/* Mini browser chrome */}
        <div className="flex items-center gap-1.5 border-b px-3 py-2">
          <span className="size-2 rounded-full bg-red-400/80" />
          <span className="size-2 rounded-full bg-amber-400/80" />
          <span className="size-2 rounded-full bg-emerald-400/80" />
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
          <span className="font-medium text-foreground">{archetypeMeta?.label}</span>
          {" · "}
          {domainLabel}
        </p>
        <p>
          {visualKit ? `${visualKit} style` : "AI picks style"} · {theme} mode
        </p>
      </div>
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
}: {
  onGenerate: (input: GeneratorInput) => void;
  generating: boolean;
  error: string | null;
  initialValues?: Partial<GeneratorInput>;
  aiAvailable?: boolean;
  editMode?: boolean;
}) {
  const iv = initialValues ?? {};
  const [step, setStep] = useState(1);
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

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-xl shadow-black/5 backdrop-blur dark:border-white/10 dark:bg-card/50">
      {/* Wizard header */}
      <div className="border-b border-border/70 px-4 py-4 sm:px-6 dark:border-white/10">
        <StepIndicator step={step} />
        <p className="mt-3 text-sm text-muted-foreground">
          {WIZARD_STEPS[step - 1]?.subtitle}
        </p>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_280px]">
        {/* Main step content */}
        <div className="min-w-0">
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
                              ? "border-foreground bg-accent ring-2 ring-foreground/20"
                              : "border-input hover:border-foreground/30 hover:bg-accent/40"
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
                            "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all hover:scale-[1.02]",
                            active
                              ? "border-foreground bg-accent ring-2 ring-foreground/20"
                              : "border-input hover:border-foreground/30 hover:bg-accent/40"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-10 items-center justify-center rounded-full",
                              active ? "bg-foreground text-background" : "bg-muted"
                            )}
                          >
                            <Icon className="size-5" />
                          </span>
                          <span className="text-xs font-semibold">{d.label}</span>
                          <span className="text-[10px] leading-tight text-muted-foreground">
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
                              ? "border-foreground bg-accent ring-2 ring-foreground/20"
                              : "border-input hover:bg-accent/40"
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

        {/* Live preview — sticky on desktop */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <LivePreviewPanel
            archetype={archetype}
            domain={domain}
            domainLabel={domainLabel}
            theme={theme}
            visualKit={visualKit}
            accent={accent ?? undefined}
            name={name}
          />
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between gap-3 border-t border-border/70 px-4 py-4 sm:px-6 dark:border-white/10">
        <Button
          type="button"
          variant="outline"
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {step < 3 ? (
          <Button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Continue
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            disabled={!canGenerate || generating}
            onClick={handleGenerate}
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {editMode
                  ? aiAvailable && useAI
                    ? "Updating your site…"
                    : "Saving…"
                  : aiAvailable && useAI
                    ? "Writing your site…"
                    : "Generating…"}
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                {editMode ? "Save & publish" : "Generate my site"}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
