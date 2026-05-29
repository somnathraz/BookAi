"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Copy, ExternalLink, Loader2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuilderForm } from "@/components/generator/BuilderForm";
import { AuroraBackground } from "@/components/generator/AuroraBackground";
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
  const [step, setStep] = useState<Step>("chooser");
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [activeSource, setActiveSource] = useState<SmartSource | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [initialValues, setInitialValues] = useState<Partial<GeneratorInput>>();

  const [site, setSite] = useState<SiteData | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ThemeMode>("light");
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [pendingInput, setPendingInput] = useState<GeneratorInput | null>(null);

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

    // Restore verified session from the httpOnly cookie (valid 7 days).
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { email?: string } | null) => {
        if (data?.email) {
          setVerified(true);
          setVerifiedEmail(data.email);
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  function choose(source: SourceId) {
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

  // Accounts model: every generation requires a verified email session.
  function handleGenerate(input: GeneratorInput) {
    setInitialValues(input); // preserve edits when returning from preview
    setPendingInput(input);
    if (!verified) {
      setStep("verify");
    } else {
      void doGenerate(input);
    }
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
      if (!res.ok) throw new Error(data?.error ?? "Generation failed.");
      setSite(data.site as SiteData);
      setSlug((data.slug as string) ?? null);
      setPublishedUrl((data.url as string) ?? null);
      setPreviewTheme((data.site as SiteData).theme);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("review");
    }
  }

  function shareUrl(): string | null {
    if (publishedUrl) return publishedUrl;
    if (slug && typeof window !== "undefined") {
      return `${window.location.origin}/${slug}`;
    }
    return slug ? `/${slug}` : null;
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
    const liveHref = slug ? `/${slug}` : null;
    const displayUrl = shareUrl();

    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur">
          <Button variant="ghost" size="sm" onClick={() => setStep("review")}>
            <ArrowLeft className="size-4" />
            Back to editor
          </Button>
          <div className="flex items-center gap-2">
            {liveHref ? (
              <>
                <a
                  href={liveHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden max-w-[min(100%,20rem)] items-center gap-1.5 truncate rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
                  title={displayUrl ?? undefined}
                >
                  <span className="shrink-0 text-foreground">Live at</span>
                  <span className="truncate font-mono">
                    {displayUrl?.replace(/^https?:\/\//, "") ?? `/${slug}`}
                  </span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden rounded-full sm:inline-flex"
                  onClick={() => void copyShareUrl()}
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </>
            ) : (
              <Badge variant="outline" className="hidden rounded-full sm:inline-flex">
                Live preview
              </Badge>
            )}
          </div>
        </div>
        <GeneratedSite
          site={site}
          theme={previewTheme}
          onThemeChange={setPreviewTheme}
        />
      </div>
    );
  }

  // ---- Builder (chooser / source / review) ----
  return (
    <main className="relative min-h-screen overflow-hidden">
      <AuroraBackground />
      <MarketingNav />

      <div className="relative mx-auto max-w-3xl px-6 pb-24 pt-20 sm:pt-28">
        {step === "chooser" ? (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
            className="text-center"
          >
            <motion.div variants={fadeUp}>
              <Badge
                variant="outline"
                className="mb-6 rounded-full border-border/70 bg-background/40 px-3 py-1 backdrop-blur"
              >
                <Sparkles className="mr-1.5 size-3.5" />
                One-page sites, generated from who you are
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-balance text-5xl font-semibold tracking-tight sm:text-7xl"
            >
              <span className="text-foreground">Your site,</span>{" "}
              <span className="bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent">
                built in minutes
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground"
            >
              Start from your resume, your Google Business page, a site you like,
              or just fill it in. We turn it into a polished, on-brand one-page
              site — light or dark, booking-ready.
            </motion.p>
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: step === "chooser" ? 0.4 : 0, ease: EASE }}
          className={cn("relative", step === "chooser" ? "mt-14" : "mt-4")}
        >
          <div className="absolute -inset-px rounded-[1.4rem] bg-gradient-to-br from-white/15 via-transparent to-white/5 opacity-80" />
          <div className="relative rounded-3xl border border-white/10 bg-card/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-9">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            {step === "chooser" ? (
              capabilities ? (
                <SourceChooser capabilities={capabilities} onChoose={choose} />
              ) : (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Checking what&apos;s available…
                </div>
              )
            ) : null}

            {step === "source" && activeSource ? (
              <SourceInput
                source={activeSource}
                onBack={() => setStep("chooser")}
                onAnalyzed={onAnalyzed}
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
                  providerLabel={
                    capabilities?.providers.find(
                      (p) => p.id === capabilities.provider
                    )?.label ?? null
                  }
                />
              </div>
            ) : null}

            {step === "verify" ? (
              <EmailGate
                onBack={() => setStep("review")}
                onVerified={(email) => {
                  setVerified(true);
                  setVerifiedEmail(email);
                  if (pendingInput) void doGenerate(pendingInput);
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
                <div className="flex size-14 items-center justify-center rounded-2xl border bg-card">
                  <Sparkles className="size-6 text-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">You&apos;ve used your free site</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    {error ??
                      "Your free plan includes one generated site. Paid plans with more sites are coming soon."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {site ? (
                    <Button onClick={() => setStep("preview")}>
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

        {step === "chooser" ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-8 text-center text-sm text-muted-foreground"
          >
            Manage, edit &amp; re-theme your sites anytime — WhatsApp &amp; email
            booking are coming next.
          </motion.p>
        ) : null}
      </div>
    </main>
  );
}
