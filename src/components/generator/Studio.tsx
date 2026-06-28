"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  LayoutGrid,
  Loader2,
  MapPin,
  Quote,
} from "lucide-react";

import { PRODUCT_NAME } from "@/lib/brand";
import {
  getPublicSiteHref,
  getPublicSitePath,
  getPublicSiteUrl,
} from "@/lib/site-url";
import { STUDIO_RESET_EVENT } from "@/lib/studio-reset";
import {
  clearStudioDraft,
  loadStudioDraft,
  saveStudioDraft,
} from "@/lib/studio-draft";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuilderForm } from "@/components/generator/BuilderForm";
import { AuroraBackground } from "@/components/generator/AuroraBackground";
import { LogoMark } from "@/components/marketing/Logo";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { GeneratedSite } from "@/components/generated/GeneratedSite";
import {
  SourceChooser,
  type Capabilities,
  type SourceId,
} from "@/components/generator/SourceChooser";
import { SourceInput } from "@/components/generator/SourceInput";
import { AnalysisReveal } from "@/components/generator/AnalysisReveal";
import { EmailGate } from "@/components/generator/EmailGate";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { GeneratingOverlay } from "@/components/generator/GeneratingOverlay";
import type {
  AnalysisResult,
  GeneratorInput,
  SiteData,
  ThemeMode,
} from "@/lib/types";

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const proofSignals = [
  {
    icon: MapPin,
    label: "Local proof",
    value: "Reviews, photos, hours",
  },
  {
    icon: FileText,
    label: "Profile proof",
    value: "Roles, skills, projects",
  },
  {
    icon: Quote,
    label: "Sharper copy",
    value: "Claims tied to source data",
  },
  {
    icon: Globe,
    label: "Live output",
    value: "A shareable one-page site",
  },
];

const detailPoints = [
  {
    title: "Source before style",
    body: "The page starts with what customers, resumes, and real links already say, then turns that into a clean one-page site.",
  },
  {
    title: "Specific by default",
    body: "Sections are chosen by archetype, so a clinic reads like a clinic and a resume reads like a professional profile.",
  },
  {
    title: "Publishable in one flow",
    body: "Import and review first, verify email when you're ready to publish, then share a live path-based site from the same workspace.",
  },
];

type Step =
  | "chooser"
  | "source"
  | "analysis"
  | "review"
  | "verify"
  | "generating"
  | "limit"
  | "preview";
type SmartSource = Exclude<SourceId, "manual">;

export function Studio() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>("chooser");
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [activeSource, setActiveSource] = useState<SmartSource | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [initialValues, setInitialValues] = useState<Partial<GeneratorInput>>();

  const [site, setSite] = useState<SiteData | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ThemeMode>("light");
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(true);
  const [pendingInput, setPendingInput] = useState<GeneratorInput | null>(null);

  const resetToChooser = useCallback(() => {
    setStep("chooser");
    setActiveSource(null);
    setAnalysis(null);
    setInitialValues(undefined);
    setSite(null);
    setSlug(null);
    setError(null);
    setPendingInput(null);
    setCopied(false);
    clearStudioDraft();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    function onReset() {
      resetToChooser();
    }
    window.addEventListener(STUDIO_RESET_EVENT, onReset);

    const params = new URLSearchParams(window.location.search);
    if (params.has("new")) {
      resetToChooser();
      window.history.replaceState(null, "", "/");
    }

    return () => window.removeEventListener(STUDIO_RESET_EVENT, onReset);
  }, [resetToChooser]);

  useEffect(() => {
    fetch("/api/capabilities")
      .then((r) => r.json())
      .then((c: Capabilities) => setCapabilities(c))
      .catch(() =>
        setCapabilities({
          ai: false,
          provider: null,
          providers: [],
          google: false,
          email: false,
        })
      );

    // Long-lived verified session (30 days by default) — skip OTP if still valid.
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data: {
            email?: string;
            canCreate?: boolean;
            limitReason?: string;
          } | null
        ) => {
          if (data?.email) {
            setVerified(true);
            setVerifiedEmail(data.email);
            setCanCreate(data.canCreate !== false);
            if (data.canCreate === false && data.limitReason) {
              setError(data.limitReason);
            }
          }
        }
      )
      .catch(() => {
        /* ignore */
      });

    // Resume in-progress import/review so we don't re-call paid APIs.
    const params = new URLSearchParams(window.location.search);
    if (!params.has("new")) {
      const draft = loadStudioDraft();
      if (draft) {
        if (draft.activeSource) setActiveSource(draft.activeSource);
        if (draft.analysis) setAnalysis(draft.analysis);
        if (draft.initialValues) setInitialValues(draft.initialValues);
        setStep(draft.step);
      }
    }
  }, []);

  // Persist import data across refresh / short absence (7 days in sessionStorage).
  useEffect(() => {
    if (
      step === "chooser" ||
      step === "verify" ||
      step === "generating" ||
      step === "preview" ||
      step === "limit"
    ) {
      return;
    }
    saveStudioDraft({
      step,
      analysis,
      initialValues,
      activeSource,
    });
  }, [step, analysis, initialValues, activeSource]);

  function choose(source: SourceId) {
    if (source !== "manual" && verified && !canCreate) {
      setError("You've used your free site. Delete one in My sites or upgrade to Pro.");
      setStep("limit");
      return;
    }
    if (source === "manual") {
      setInitialValues(undefined);
      setStep("review");
    } else {
      setActiveSource(source);
      setStep("source");
    }
  }

  function onAnalyzed(result: AnalysisResult) {
    setAnalysis(result);
    setStep("analysis");
  }

  function onAnalysisConfirmed(values: Partial<GeneratorInput>) {
    setInitialValues({ ...values, theme: values.theme ?? "light" });
    setStep("review");
  }

  function handleGenerate(input: GeneratorInput) {
    setInitialValues(input); // preserve edits when returning from preview
    setPendingInput(input);
    if (verified && !canCreate) {
      setError("You've used your free site. Delete one in My sites or upgrade to Pro.");
      setStep("limit");
      return;
    }
    const emailGateOn = Boolean(capabilities?.email);
    if (emailGateOn && !verified) {
      setStep("verify");
      return;
    }
    void doGenerate(input);
  }

  async function doGenerate(input: GeneratorInput) {
    setStep("generating");
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (res.status === 401 && data?.code === "verify_required") {
        setVerified(false);
        setStep("verify");
        return;
      }
      if (res.status === 402 && data?.code === "limit_reached") {
        setError(data.error as string);
        setStep("limit");
        return;
      }
      if (res.status === 429 && data?.code === "rate_limited") {
        setError(data.error as string);
        setStep("review");
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? "Generation failed.");
      const publishedSlug = data.slug as string;
      clearStudioDraft();
      const liveUrl = getPublicSiteUrl(publishedSlug, { host: window.location.host });
      window.location.assign(liveUrl);
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("review");
    }
  }

  function shareUrl(): string | null {
    if (!slug) return null;
    if (typeof window !== "undefined") {
      return getPublicSiteUrl(slug, { host: window.location.host });
    }
    return getPublicSitePath(slug);
  }

  function liveHref(): string | null {
    if (!slug) return null;
    if (typeof window !== "undefined") {
      return getPublicSiteHref(slug, { host: window.location.host });
    }
    return getPublicSiteHref(slug);
  }

  async function copyShareUrl() {
    const url = shareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  // ---- Preview ----
  if (step === "preview" && site) {
    const href = liveHref();
    const displayUrl = shareUrl();

    return (
      <div className="min-h-screen pb-28">
        {/* Generated site fills full viewport */}
        <GeneratedSite
          site={site}
          theme={previewTheme}
          onThemeChange={setPreviewTheme}
        />

        {/* Floating bottom bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2"
        >
          <div className="flex items-stretch overflow-hidden rounded-2xl border border-border/70 bg-background/92 shadow-2xl shadow-black/12 backdrop-blur-xl dark:bg-background/88">

            {/* Back to editor */}
            <button
              type="button"
              onClick={() => setStep("review")}
              className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <ArrowLeft className="size-4 shrink-0" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            <div className="my-2.5 w-px bg-border/70" />

            {/* Verified email */}
            {verifiedEmail ? (
              <>
                <div className="flex min-w-0 items-center gap-2 px-4 py-3.5">
                  <BadgeCheck className="size-4 shrink-0 text-emerald-500" strokeWidth={2} />
                  <span className="max-w-[10rem] truncate text-xs text-muted-foreground sm:max-w-[14rem]">
                    {verifiedEmail}
                  </span>
                </div>
                <div className="my-2.5 w-px bg-border/70" />
              </>
            ) : null}

            {/* Shareable link + copy */}
            <div className="flex min-w-0 flex-1 items-center">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 flex-1 items-center gap-1.5 px-4 py-3.5 transition-colors hover:bg-accent"
                  title={displayUrl ?? undefined}
                >
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {displayUrl?.replace(/^https?:\/\//, "") ?? `/${slug}`}
                  </span>
                </a>
              ) : (
                <span className="flex-1 px-4 py-3.5 text-xs text-muted-foreground">
                  Live preview
                </span>
              )}
              <button
                type="button"
                onClick={() => void copyShareUrl()}
                className="flex items-center gap-1.5 border-l border-border/70 px-4 py-3.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                {copied ? (
                  <Check className="size-4 shrink-0 text-emerald-500" />
                ) : (
                  <Copy className="size-4 shrink-0" />
                )}
                <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>

            <div className="my-2.5 w-px bg-border/70" />

            {/* My sites */}
            <a
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <LayoutGrid className="size-4 shrink-0" />
              <span className="hidden sm:inline">My sites</span>
            </a>

          </div>
        </motion.div>
      </div>
    );
  }

  // ---- Builder (chooser / source / review) ----
  return (
    <main className="relative min-h-screen overflow-hidden">
      <AuroraBackground />
      <MarketingNav />

      {step === "chooser" ? (
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-6 sm:pt-14 lg:pb-28">
          <div className="grid min-h-[calc(100svh-8rem)] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div
              initial={reduceMotion ? "show" : "hidden"}
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
              className="max-w-2xl"
            >
              <motion.div
                variants={fadeUp}
                className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-border/70 bg-background/60 py-1.5 pl-2 pr-3.5 text-xs font-medium text-muted-foreground backdrop-blur dark:border-white/10 dark:bg-white/[0.04]"
              >
                <LogoMark size={20} priority />
                <span className="font-semibold text-foreground">{PRODUCT_NAME}</span>
                <span className="h-3 w-px bg-border" />
                Real-input website builder
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="text-balance bg-gradient-to-br from-foreground via-foreground to-foreground/55 bg-clip-text text-5xl font-semibold leading-[1.05] tracking-tight text-transparent sm:text-6xl lg:text-7xl"
              >
                Build a site from proof, not placeholders.
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg"
              >
                Start from a simple brief, Google reviews, a resume, or a reference
                site. {PRODUCT_NAME} turns real source material into a focused page
                you can review, publish, and share.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => choose("manual")}
                  className="h-12 px-6 text-base"
                >
                  Start building now
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    document.getElementById("source-console")?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                  className="h-12 bg-background/35 px-6 text-base backdrop-blur lg:hidden"
                >
                  Choose a source
                </Button>
              </motion.div>
              <motion.ul
                variants={fadeUp}
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
              >
                {["Free to start", "No credit card", "Live in minutes"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="size-4 text-foreground" strokeWidth={2.2} />
                    {t}
                  </li>
                ))}
              </motion.ul>
              <motion.div
                variants={fadeUp}
                className="mt-10 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 shadow-xl shadow-black/5 dark:border-white/10 dark:bg-white/10 dark:shadow-black/20 sm:grid-cols-4"
              >
                {proofSignals.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-background/75 p-4 backdrop-blur dark:bg-background/45">
                    <Icon className="mb-3 size-4 text-foreground" strokeWidth={1.7} />
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{value}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.18, ease: EASE }}
              className="relative"
              id="source-console"
            >
              <div className="absolute -inset-px rounded-lg bg-border/80 opacity-80 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.34),rgba(255,255,255,0.04),rgba(255,255,255,0.18))]" />
              <div className="relative overflow-hidden rounded-lg border border-border/70 bg-background/80 shadow-2xl shadow-black/10 backdrop-blur-2xl dark:border-white/10 dark:bg-background/58 dark:shadow-black/35">
                <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-sm bg-[#ea4335]" />
                    <span className="size-2 rounded-sm bg-[#fbbc05]" />
                    <span className="size-2 rounded-sm bg-[#34a853]" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BadgeCheck className="size-3.5 text-foreground" />
                    Source console
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="mb-5 border-b border-border/70 pb-5 dark:border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          Start here
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          Pick one option to begin
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="rounded-md border-border/70 bg-background/60 text-muted-foreground dark:border-white/15 dark:bg-white/[0.04]"
                      >
                        Review first
                      </Badge>
                    </div>
                  </div>

                  {capabilities ? (
                    <SourceChooser
                      capabilities={capabilities}
                      canCreate={!verified || canCreate}
                      onChoose={choose}
                    />
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Checking available imports
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, ease: EASE }}
            className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 shadow-xl shadow-black/5 dark:border-white/10 dark:bg-white/10 dark:shadow-black/20 md:grid-cols-3"
          >
            {detailPoints.map((point) => (
              <div key={point.title} className="bg-background/75 p-5 backdrop-blur dark:bg-background/45">
                <p className="text-sm font-semibold text-foreground">{point.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{point.body}</p>
              </div>
            ))}
          </motion.div>
        </div>
      ) : (
        <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-3xl px-6 pb-24 pt-8 sm:pt-12">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative mt-4 w-full"
          >
            <div className="relative w-full">
            {step === "source" && activeSource ? (
              <SourceInput
                source={activeSource}
                onBack={() => setStep("chooser")}
                onAnalyzed={onAnalyzed}
                onLimitReached={(msg) => {
                  setError(msg);
                  setStep("limit");
                }}
              />
            ) : null}

            {step === "analysis" && analysis ? (
              <AnalysisReveal
                analysis={analysis}
                onBack={() => setStep(activeSource ? "source" : "chooser")}
                onConfirm={onAnalysisConfirmed}
              />
            ) : null}

            {step === "review" ? (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Review &amp; edit</h2>
                    <p className="text-sm text-muted-foreground">
                      {initialValues
                        ? "We pre-filled this from your import. Tweak anything, then generate."
                        : "Fill in what you can — we'll write the rest from your profession."}
                    </p>
                    {verifiedEmail ? (
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-xs text-muted-foreground/80">
                          Signed in as {verifiedEmail}
                        </p>
                        <SignOutButton
                          label="Switch account"
                          className="h-auto px-1 py-0 text-xs"
                          onSignedOut={() => {
                            setVerified(false);
                            setVerifiedEmail(null);
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("chooser")}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="size-4" />
                    Start over
                  </button>
                </div>
                <BuilderForm
                  key={JSON.stringify(initialValues ?? {})}
                  onGenerate={handleGenerate}
                  generating={false}
                  error={error}
                  initialValues={initialValues}
                  aiAvailable={Boolean(capabilities?.ai)}
                />
              </div>
            ) : null}

            {step === "verify" ? (
              <EmailGate
                intent="generate"
                onBack={() => setStep("review")}
                onVerified={(email) => {
                  setVerified(true);
                  setVerifiedEmail(email);
                  fetch("/api/auth/session")
                    .then((r) => (r.ok ? r.json() : null))
                    .then((data: { canCreate?: boolean; limitReason?: string } | null) => {
                      const allowed = data?.canCreate !== false;
                      setCanCreate(allowed);
                      if (!allowed) {
                        setError(
                          data?.limitReason ??
                            "You've used your free site. Delete one in My sites or upgrade to Pro."
                        );
                        setStep("limit");
                        return;
                      }
                      if (pendingInput) void doGenerate(pendingInput);
                    })
                    .catch(() => {
                      if (pendingInput) void doGenerate(pendingInput);
                    });
                }}
              />
            ) : null}

            {step === "generating" ? (
              <GeneratingOverlay
                useAI={Boolean(capabilities?.ai && pendingInput?.useAI !== false)}
              />
            ) : null}

            {step === "limit" ? (
              <div className="flex flex-col items-center gap-5 py-8 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl border bg-card p-2">
                  <LogoMark size={40} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">You&apos;ve used your free site</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    {error ??
                      "Your free plan includes one generated site. Paid plans with more sites are coming soon."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {slug ? (
                    <Button
                      onClick={() =>
                        window.location.assign(
                          getPublicSiteUrl(slug, { host: window.location.host })
                        )
                      }
                    >
                      View my site
                    </Button>
                  ) : null}
                  <Button variant="outline" disabled title="Coming soon">
                    Upgrade — coming soon
                  </Button>
                </div>
              </div>
            ) : null}
            </div>
          </motion.div>
        </div>
      )}
      <MarketingFooter />
    </main>
  );
}
