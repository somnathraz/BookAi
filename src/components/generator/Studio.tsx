"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Check,
  FileText,
  Globe,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  Monitor,
  PenLine,
  Smartphone,
  Sparkles,
} from "lucide-react";

import { trackSitePublished, waitForBeacon } from "@/lib/analytics";
import {
  getPublicSiteUrl,
} from "@/lib/site-url";
import { STUDIO_RESET_EVENT } from "@/lib/studio-reset";
import {
  clearStudioDraft,
  loadStudioDraft,
  saveDraftSitePreview,
  saveStudioDraft,
} from "@/lib/studio-draft";
import { Button } from "@/components/ui/button";
import { BuilderForm } from "@/components/generator/BuilderForm";
import { BusinessStart } from "@/components/generator/BusinessStart";
import { AuroraBackground } from "@/components/generator/AuroraBackground";
import { Hero3D } from "@/components/marketing/Hero3D";
import { ComingSoonNotify } from "@/components/marketing/ComingSoonNotify";
import { LogoMark } from "@/components/marketing/Logo";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { SupportBot } from "@/components/marketing/SupportBot";
import { GeneratedSite } from "@/components/generated/GeneratedSite";
import { SourceInput } from "@/components/generator/SourceInput";
import { AnalysisReveal } from "@/components/generator/AnalysisReveal";
import { EmailGate } from "@/components/generator/EmailGate";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { GeneratingOverlay } from "@/components/generator/GeneratingOverlay";
import { PublishSuccess } from "@/components/generator/PublishSuccess";
import { siteToGeneratorInput } from "@/lib/site-to-input";
import { deriveArchetype } from "@/lib/compose";
import { generateSite } from "@/lib/template";
import { cn } from "@/lib/utils";
import type {
  AnalysisResult,
  Capabilities,
  GeneratorInput,
  SiteData,
  SourceId,
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
    label: "Google details",
    value: "Photos, reviews, hours",
  },
  {
    icon: CalendarCheck,
    label: "Ready for customers",
    value: "Booking, calls, directions",
  },
  {
    icon: MessageCircle,
    label: "Easy enquiries",
    value: "WhatsApp built in",
  },
  {
    icon: Link2,
    label: "Your own link",
    value: "Free PaperChai address",
  },
];

const detailPoints = [
  {
    number: "01",
    title: "Find your business",
    body: "Search by name and city, or paste the Share link from Google Maps.",
  },
  {
    number: "02",
    title: "Review your website",
    body: "Check the imported details, choose a style, and make quick changes.",
  },
  {
    number: "03",
    title: "Publish and share",
    body: "Go live on a free PaperChai link. Nothing publishes without your approval.",
  },
];

type Step =
  | "chooser"
  | "source"
  | "analysis"
  | "review"
  | "verify"
  | "generating"
  | "published"
  | "limit"
  | "preview";
type SmartSource = Exclude<SourceId, "manual">;

function previewInputFromAnalysis(result: AnalysisResult): GeneratorInput | null {
  const name = result.profile.name?.trim();
  if (!name) return null;

  const domain =
    result.categories[0]?.domain ?? result.profile.domain ?? "other";
  const archetype = deriveArchetype(domain, result.source);
  const images = result.images.filter(Boolean).slice(0, 20);

  return {
    ...result.profile,
    source: result.source,
    name,
    domain,
    theme: result.profile.theme ?? "light",
    accent: result.profile.accent ?? result.palette[0],
    photo: result.profile.photo ?? images[0],
    archetype,
    gallery: archetype === "business" ? images : [],
    // Analysis already wrote source-grounded copy. Keeping template generation
    // deterministic makes the published site match the approved preview.
    useAI: false,
  };
}

export function Studio({ editSiteId }: { editSiteId?: string } = {}) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>(editSiteId ? "review" : "chooser");
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [activeSource, setActiveSource] = useState<SmartSource | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [initialValues, setInitialValues] = useState<Partial<GeneratorInput>>();

  const [site, setSite] = useState<SiteData | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<ThemeMode>("light");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(true);
  const [pendingInput, setPendingInput] = useState<GeneratorInput | null>(null);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(editSiteId ?? null);
  const [editLoading, setEditLoading] = useState(Boolean(editSiteId));
  const [editLoadError, setEditLoadError] = useState<string | null>(null);
  const [publishedMeta, setPublishedMeta] = useState<{
    siteId: string;
    slug: string;
    siteName: string;
    liveUrl: string;
  } | null>(null);

  const resetToChooser = useCallback(() => {
    setStep("chooser");
    setActiveSource(null);
    setAnalysis(null);
    setInitialValues(undefined);
    setSite(null);
    setSlug(null);
    setError(null);
    setPendingInput(null);
    setEditingSiteId(null);
    setEditLoadError(null);
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
    function onStudioHistory(event: PopStateEvent) {
      const historyStep = event.state?.paperchaiStudioStep as Step | undefined;
      if (historyStep === "preview" && site) {
        setStep("preview");
      } else if (historyStep === "review") {
        setStep("review");
      } else if (historyStep === "source" && activeSource) {
        setStep("source");
      } else if (historyStep === "chooser") {
        setStep("chooser");
      }
    }

    window.addEventListener("popstate", onStudioHistory);
    return () => window.removeEventListener("popstate", onStudioHistory);
  }, [activeSource, site]);

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
          businessSearch: false,
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
    if (!params.has("new") && !editSiteId) {
      const draft = loadStudioDraft();
      if (draft) {
        if (draft.activeSource) setActiveSource(draft.activeSource);
        if (draft.analysis) setAnalysis(draft.analysis);
        if (draft.initialValues) setInitialValues(draft.initialValues);
        if (draft.step === "analysis" && draft.analysis) {
          // Resume at the import review so a candidate can still choose their
          // early-career or experienced profile layout after a refresh.
          setStep("analysis");
        } else if (
          draft.step === "preview" &&
          draft.initialValues?.name &&
          draft.initialValues.domain &&
          draft.initialValues.theme
        ) {
          const input = draft.initialValues as GeneratorInput;
          setPendingInput(input);
          setSite(generateSite(input));
          setPreviewTheme(input.theme);
          setStep("preview");
        } else {
          setStep(draft.step);
        }
      }
    }
  }, [editSiteId]);

  useEffect(() => {
    if (!editSiteId) return;

    let cancelled = false;
    setEditLoading(true);
    setEditLoadError(null);

    fetch(`/api/sites/${encodeURIComponent(editSiteId)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.status === 401) {
          setEditingSiteId(editSiteId);
          setStep("verify");
          setEditLoading(false);
          return;
        }
        if (!res.ok) {
          const msg =
            res.status === 404
              ? "This site was deleted or is no longer available."
              : ((data.error as string) ?? "This site could not be loaded.");
          setEditLoadError(msg);
          setEditLoading(false);
          return;
        }

        const loadedSite = data.site as SiteData;
        setEditingSiteId(data.id as string);
        setSlug(data.slug as string);
        setSite(loadedSite);
        setPreviewTheme((data.theme as ThemeMode) ?? loadedSite.theme);
        setInitialValues(siteToGeneratorInput(loadedSite));
        setStep("review");
        setEditLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setEditLoadError("Could not load this site. Try again from My sites.");
          setEditLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [editSiteId]);

  // Persist import data across refresh / short absence (7 days in sessionStorage).
  useEffect(() => {
    if (
      step === "chooser" ||
      step === "verify" ||
      step === "generating" ||
      step === "published" ||
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
      setError("You've used your free site. Delete one in My sites or upgrade to Basic.");
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
    if (result.source !== "manual") setActiveSource(result.source);
    setAnalysis(result);
    setStep("analysis");
  }

  function confirmAnalysis(values: Partial<GeneratorInput>) {
    if (!analysis) return;
    const input = previewInputFromAnalysis(analysis);
    if (!input) {
      setInitialValues({ ...analysis.profile, ...values, source: analysis.source });
      setStep("review");
      return;
    }
    openDraftPreview({ ...input, ...values });
  }

  function handleGenerate(input: GeneratorInput) {
    if (!editingSiteId) {
      openDraftPreview({ ...input, useAI: false });
      return;
    }

    setInitialValues(input);
    setPendingInput(input);
    if (verified && !canCreate && !editingSiteId) {
      setError("You've used your free site. Delete one in My sites or upgrade to Basic.");
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

  function openDraftPreview(input: GeneratorInput) {
    const exactInput = { ...input, useAI: false };
    const generatedDraft = generateSite(exactInput);
    const currentHistory = window.history.state ?? {};
    const returnStep: Step =
      step === "review" ? "review" : activeSource ? "source" : "chooser";
    window.history.replaceState(
      { ...currentHistory, paperchaiStudioStep: returnStep },
      ""
    );
    window.history.pushState(
      { ...currentHistory, paperchaiStudioStep: "preview" },
      ""
    );
    setInitialValues(exactInput);
    setPendingInput(exactInput);
    setSite(generatedDraft);
    saveDraftSitePreview(generatedDraft, exactInput.theme);
    setSlug(null);
    setPreviewTheme(exactInput.theme);
    setPreviewDevice("desktop");
    setError(null);
    setStep("preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEditor() {
    const currentHistory = window.history.state ?? {};
    window.history.pushState(
      { ...currentHistory, paperchaiStudioStep: "review" },
      ""
    );
    setStep("review");
  }

  function handlePublish() {
    if (!pendingInput) return;
    if (verified && !canCreate && !editingSiteId) {
      setError("You've used your free site. Delete one in My sites or upgrade to Basic.");
      setStep("limit");
      return;
    }
    if (!verified) {
      setStep("verify");
      return;
    }
    void doGenerate(pendingInput);
  }

  function changePreviewTheme(nextTheme: ThemeMode) {
    setPreviewTheme(nextTheme);
    setPendingInput((current) =>
      current ? { ...current, theme: nextTheme } : current
    );
    setInitialValues((current) =>
      current ? { ...current, theme: nextTheme } : current
    );
    setSite((current) => {
      if (!current) return current;
      const nextSite = { ...current, theme: nextTheme };
      saveDraftSitePreview(nextSite, nextTheme);
      return nextSite;
    });
  }

  useEffect(() => {
    function onPreviewMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (
        event.data?.type === "paperchai-preview-theme" &&
        (event.data.theme === "light" || event.data.theme === "dark")
      ) {
        changePreviewTheme(event.data.theme);
      }
    }

    window.addEventListener("message", onPreviewMessage);
    return () => window.removeEventListener("message", onPreviewMessage);
  });

  async function doGenerate(input: GeneratorInput) {
    setStep("generating");
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          ...(editingSiteId ? { siteId: editingSiteId } : {}),
        }),
      });
      const data = await res.json();
      if (res.status === 401 && data?.code === "verify_required") {
        setVerified(false);
        setStep("verify");
        return;
      }
      if (res.status === 404) {
        setError(
          "This site was deleted or is no longer available. Head back to My sites."
        );
        setStep("review");
        setEditingSiteId(null);
        return;
      }
      if (res.status === 402 && data?.code === "limit_reached") {
        setError(data.error as string);
        setStep("limit");
        return;
      }
      if (res.status === 429 && data?.code === "rate_limited") {
        setError(data.error as string);
        setStep(site && !editingSiteId ? "preview" : "review");
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? "Generation failed.");
      const publishedSlug = data.slug as string;
      const isUpdate = Boolean(data.updated);
      const engine = data.engine === "ai" ? "ai" : "template";
      clearStudioDraft();
      const liveUrl = getPublicSiteUrl(publishedSlug, { host: window.location.host });
      await waitForBeacon((done) => {
        trackSitePublished(
          {
            site_id: String(data.siteId ?? ""),
            slug: publishedSlug,
            is_update: isUpdate,
            engine,
          },
          { event_callback: done }
        );
      });
      if (!isUpdate) {
        const siteName =
          (data.site as SiteData | undefined)?.identity?.name?.trim() ||
          pendingInput?.name?.trim() ||
          "Your site";
        setSlug(publishedSlug);
        setPublishedMeta({
          siteId: String(data.siteId ?? ""),
          slug: publishedSlug,
          siteName,
          liveUrl,
        });
        setStep("published");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      window.location.assign(liveUrl);
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep(site && !editingSiteId ? "preview" : "review");
    }
  }

  // ---- Published (first publish success) ----
  if (step === "published" && publishedMeta) {
    return (
      <main className="relative min-h-screen overflow-x-hidden bg-[#f3f3ef] dark:bg-[#0d0f0d]">
        <MarketingNav />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <PublishSuccess
            siteId={publishedMeta.siteId}
            siteName={publishedMeta.siteName}
            liveUrl={publishedMeta.liveUrl}
            settingsUrl={`/dashboard/${publishedMeta.siteId}`}
            onViewSite={() => window.location.assign(publishedMeta.liveUrl)}
          />
        </div>
        <MarketingFooter />
      </main>
    );
  }

  // ---- Preview ----
  if (step === "preview" && site) {
    return (
      <div className="min-h-screen bg-[#dfe0da] pb-24 text-[#11130f] sm:pb-8">
        <header className="sticky top-0 z-[60] border-b border-white/10 bg-[#111311]/95 text-stone-100 shadow-[0_16px_45px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="size-2 rounded-full bg-[#9cc2b3] shadow-[0_0_0_5px_rgba(156,194,179,0.12)]" />
                Website preview
              </p>
              <p className="mt-0.5 hidden text-xs text-stone-400 sm:block">
                Not published yet. Review it, edit only if needed, then go live.
              </p>
            </div>

            <div className="hidden items-center rounded-xl border border-white/10 bg-white/[0.05] p-1 sm:flex">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                aria-label="Desktop preview"
                className={cn(
                  "flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium transition",
                  previewDevice === "desktop"
                    ? "bg-[#9cc2b3] text-[#0d0f0d]"
                    : "text-stone-400 hover:text-white"
                )}
              >
                <Monitor className="size-4" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                aria-label="Mobile preview"
                className={cn(
                  "flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium transition",
                  previewDevice === "mobile"
                    ? "bg-[#9cc2b3] text-[#0d0f0d]"
                    : "text-stone-400 hover:text-white"
                )}
              >
                <Smartphone className="size-4" />
                Mobile
              </button>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={openEditor}
                className="flex h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-medium text-stone-200 transition hover:bg-white/[0.08] hover:text-white"
              >
                <PenLine className="size-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="flex h-10 items-center gap-2 rounded-xl bg-[#9cc2b3] px-5 text-sm font-semibold text-[#0d0f0d] transition hover:bg-[#b9d5ca]"
              >
                Publish website
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="sticky top-16 z-[55] border-b border-red-950/15 bg-[#fff1ee] px-4 py-3 text-center text-sm font-medium text-[#8b2e20] shadow-sm">
            {error}
          </div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mx-auto px-0 py-0 sm:px-5 sm:py-6"
        >
          {previewDevice === "mobile" ? (
            <div className="mx-auto hidden h-[780px] w-[390px] max-w-full overflow-hidden rounded-[2rem] border-[8px] border-[#111311] bg-white shadow-[0_35px_110px_-48px_rgba(17,19,15,0.65)] sm:block">
              <iframe
                key={`${site.identity.name}-${site.identity.tagline}-${previewTheme}`}
                src="/preview/draft"
                title="Mobile website preview"
                className="size-full border-0 bg-white"
              />
            </div>
          ) : (
            <div className="mx-auto hidden min-h-screen overflow-hidden bg-background shadow-[0_35px_110px_-48px_rgba(17,19,15,0.65)] transition-[max-width,border-radius] duration-300 sm:block sm:min-h-[calc(100vh-7rem)] sm:max-w-[1440px] sm:rounded-[1.75rem]">
              <GeneratedSite
                site={site}
                theme={previewTheme}
                onThemeChange={changePreviewTheme}
              />
            </div>
          )}
          <div className="sm:hidden">
            <GeneratedSite
              site={site}
              theme={previewTheme}
              onThemeChange={changePreviewTheme}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: EASE }}
          className="fixed inset-x-3 bottom-3 z-[70] sm:hidden"
        >
          <div className="grid grid-cols-[0.8fr_1.2fr] overflow-hidden rounded-2xl border border-white/10 bg-[#111311]/96 p-1.5 shadow-[0_24px_65px_-24px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            <button
              type="button"
              onClick={openEditor}
              className="flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-medium text-stone-200 transition hover:bg-white/[0.08]"
            >
              <PenLine className="size-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={handlePublish}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#9cc2b3] px-3 text-sm font-semibold text-[#0d0f0d] transition active:scale-[0.99]"
            >
              Publish website
              <ArrowRight className="size-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---- Builder (chooser / source / review) ----
  if (editLoading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center">
        <AuroraBackground />
        <div className="relative flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading your site…
        </div>
      </main>
    );
  }

  if (editLoadError) {
    return (
      <main className="relative flex min-h-screen flex-col">
        <MarketingNav />
        <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-muted-foreground">{editLoadError}</p>
          <Button asChild>
            <Link href="/dashboard">Back to My sites</Link>
          </Button>
        </div>
        <MarketingFooter />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#f3f3ef] dark:bg-[#0d0f0d]">
      {step === "chooser" ? null : <AuroraBackground />}
      <MarketingNav />

      {step === "chooser" ? (
        <div className="relative pb-24">
          <section className="relative overflow-hidden border-b border-[#11130f]/10 bg-[#f3f3ef] dark:border-white/10 dark:bg-[#0d0f0d] lg:min-h-[calc(100svh-4rem)]">
            <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,rgba(17,19,15,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,19,15,0.035)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)] dark:opacity-20" />
            <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-10 sm:px-6 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-12">
              <motion.div
                initial={reduceMotion ? "show" : "hidden"}
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
                className="relative z-10 max-w-3xl"
              >
                <motion.p
                  variants={fadeUp}
                  className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#214f43] dark:text-[#9cc2b3]"
                >
                  <span className="size-1.5 rounded-full bg-[#214f43] dark:bg-[#9cc2b3]" />
                  PaperChai
                </motion.p>
                <motion.h1
                  variants={fadeUp}
                  className="max-w-3xl text-balance text-5xl font-medium leading-[0.98] tracking-[-0.052em] text-[#11130f] dark:text-[#f3f3ef] sm:text-6xl lg:text-[4.5rem]"
                >
                  Your business, ready for the web.
                </motion.h1>
                <motion.p
                  variants={fadeUp}
                  className="mt-6 max-w-xl text-pretty text-base leading-7 text-[#5c615b] dark:text-[#aeb4ad] sm:text-lg"
                >
                  Find your business and PaperChai turns its real photos, reviews,
                  hours, and details into a website you control.
                </motion.p>
                <motion.div id="create" variants={fadeUp} className="mt-8 max-w-2xl">
                  {capabilities ? (
                    <BusinessStart
                      capabilities={capabilities}
                      canCreate={!verified || canCreate}
                      onManual={() => choose("manual")}
                      onAnalyzed={onAnalyzed}
                      onLimitReached={(message) => {
                        setError(message);
                        setStep("limit");
                      }}
                    />
                  ) : (
                    <div className="flex h-16 items-center justify-center gap-2 rounded-2xl border border-[#11130f]/10 bg-white text-sm text-[#747a73] shadow-[0_12px_40px_-24px_rgba(17,19,15,0.35)] dark:border-white/10 dark:bg-[#151815]">
                      <Loader2 className="size-4 animate-spin" />
                      Preparing the website builder
                    </div>
                  )}
                </motion.div>
                <motion.ul
                  variants={fadeUp}
                  className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#626860] dark:text-[#9ba19a]"
                >
                  {["First website free", "No credit card", "You approve before publish"].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-1.5">
                        <Check className="size-4 text-[#214f43] dark:text-[#9cc2b3]" />
                        {item}
                      </li>
                    )
                  )}
                </motion.ul>
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.18, ease: EASE }}
                className="relative mx-auto hidden w-full max-w-xl lg:block lg:max-w-none"
              >
                <Hero3D />
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
                className="relative w-full lg:hidden"
              >
                <div className="rounded-[1.5rem] border border-[#11130f]/10 bg-white/65 p-5 dark:border-white/10 dark:bg-[#151815] sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#214f43] dark:text-[#9cc2b3]">
                    More ways to begin
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-stone-950 dark:text-stone-50">
                    Build from whatever you already have.
                  </h2>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-stone-600 dark:text-stone-300">
                    Google is the fastest path for local businesses, but it is not
                    the only path. Professionals can start from a resume, an existing
                    site, or a short guided brief.
                  </p>
                  <div className="mt-5 divide-y divide-stone-900/10 border-y border-stone-900/10 dark:divide-white/10 dark:border-white/10">
                    <div className="flex items-center gap-3 py-3.5">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-800 shadow-sm dark:bg-stone-950 dark:text-stone-200">
                        <FileText className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-stone-950 dark:text-stone-50">Resume or CV</span>
                        <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">For developers, designers, freelancers, and professionals</span>
                      </span>
                      <button
                        type="button"
                        disabled={!capabilities?.ai}
                        onClick={() => choose("resume")}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#214f43] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1a3f36] disabled:opacity-50"
                      >
                        Build
                        <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 py-3.5">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-800 shadow-sm dark:bg-stone-950 dark:text-stone-200">
                        <Globe className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-stone-950 dark:text-stone-50">Existing website</span>
                        <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">Use the structure of a site you already have</span>
                      </span>
                      <button
                        type="button"
                        disabled={!capabilities?.ai}
                        onClick={() => choose("competitor")}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#214f43] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1a3f36] disabled:opacity-50"
                      >
                        Build
                        <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 py-3.5">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-800 shadow-sm dark:bg-stone-950 dark:text-stone-200">
                        <PenLine className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-stone-950 dark:text-stone-50">Answer a few questions</span>
                        <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">No profile, document, or existing website needed</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => choose("manual")}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#214f43] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1a3f36]"
                      >
                        Build
                        <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, ease: EASE }}
            className="mx-auto max-w-6xl px-5 sm:px-6"
          >
            <div className="grid border-y border-stone-900/10 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {proofSignals.map(({ icon: Icon, label, value }, index) => (
                <div
                  key={label}
                  className={`flex gap-3 py-5 sm:px-5 ${
                    index > 0 ? "border-t border-stone-900/10 dark:border-white/10 sm:border-t-0 sm:border-l" : ""
                  }`}
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-[#214f43] dark:text-[#9cc2b3]" />
                  <div>
                    <p className="text-sm font-semibold text-stone-950 dark:text-stone-50">{label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-stone-500 dark:text-stone-400">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <section className="mx-auto mt-28 max-w-6xl px-5 sm:px-6">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: EASE }}
              className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#214f43] dark:text-[#9cc2b3]">
                  From listing to website
                </p>
                <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.04em] text-stone-950 dark:text-stone-50 sm:text-5xl">
                  Your business is already telling a story.
                </h2>
              </div>
              <p className="max-w-xl text-lg leading-8 text-stone-600 dark:text-stone-300">
                PaperChai turns the proof customers already trust on Google into a
                focused mobile website with calls, directions, WhatsApp, and booking.
              </p>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
              className="mt-12 grid overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111311] text-stone-50 shadow-[0_35px_90px_-50px_rgba(17,19,15,0.65)] md:grid-cols-[1fr_auto_1fr]"
            >
              <div className="p-7 sm:p-10">
                <div className="flex items-center gap-2 text-sm font-semibold text-stone-300">
                  <MapPin className="size-4 text-[#9cc2b3]" />
                  What you already have
                </div>
                <p className="mt-8 text-3xl font-semibold tracking-tight">Google Business</p>
                <p className="mt-3 max-w-sm leading-7 text-stone-400">
                  Business details, real photos, customer reviews, opening hours, and location.
                </p>
              </div>
              <div className="flex items-center justify-center border-y border-white/10 px-6 py-4 md:border-x md:border-y-0">
                <motion.span
                  animate={reduceMotion ? undefined : { x: [0, 7, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex size-12 items-center justify-center rounded-full bg-[#dce8e2] text-[#214f43]"
                >
                  <ArrowRight className="size-5" />
                </motion.span>
              </div>
              <div className="bg-[#214f43] p-7 text-white sm:p-10">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="size-4" />
                  What PaperChai creates
                </div>
                <p className="mt-8 text-3xl font-semibold tracking-tight">Your business website</p>
                <p className="mt-3 max-w-sm leading-7 text-white/65">
                  A polished site with customer actions, your own link, and an editor you can control.
                </p>
              </div>
            </motion.div>
          </section>

          <section className="mx-auto mt-28 max-w-6xl px-5 sm:px-6">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.65, ease: EASE }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#214f43] dark:text-[#9cc2b3]">
                How it works
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-stone-950 dark:text-stone-50 sm:text-5xl">
                Three clear steps. No blank canvas.
              </h2>
            </motion.div>
            <div className="mt-12 grid border-t border-stone-900/15 dark:border-white/15 md:grid-cols-3">
              {detailPoints.map((point, index) => (
                <motion.div
                  key={point.title}
                  initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: index * 0.08, ease: EASE }}
                  className={`py-7 md:px-7 ${
                    index > 0 ? "border-t border-stone-900/10 dark:border-white/10 md:border-l md:border-t-0" : ""
                  }`}
                >
                  <p className="font-mono text-xs text-[#214f43] dark:text-[#9cc2b3]">{point.number}</p>
                  <h3 className="mt-8 text-xl font-semibold text-stone-950 dark:text-stone-50">{point.title}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-stone-500 dark:text-stone-400">{point.body}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="mx-auto mt-28 hidden max-w-6xl px-5 sm:px-6 lg:block"
          >
            <div className="rounded-[1.5rem] border border-[#11130f]/10 bg-white/65 p-6 dark:border-white/10 dark:bg-[#151815] sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#214f43] dark:text-[#9cc2b3]">
                    More ways to begin
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-stone-950 dark:text-stone-50 sm:text-4xl">
                    Build from whatever you already have.
                  </h2>
                  <p className="mt-4 max-w-lg leading-7 text-stone-600 dark:text-stone-300">
                    Google is the fastest path for local businesses, but it is not
                    the only path. Professionals can start from a resume, an existing
                    site, or a short guided brief.
                  </p>
                </div>
                <div className="divide-y divide-stone-900/10 border-y border-stone-900/10 dark:divide-white/10 dark:border-white/10">
                  <div className="flex items-center gap-4 py-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-stone-800 shadow-sm dark:bg-stone-950 dark:text-stone-200">
                      <FileText className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-stone-950 dark:text-stone-50">Resume or CV</span>
                      <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400">For developers, designers, freelancers, and professionals</span>
                    </span>
                    <button
                      type="button"
                      disabled={!capabilities?.ai}
                      onClick={() => choose("resume")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#214f43] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a3f36] disabled:opacity-50"
                    >
                      Build
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 py-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-stone-800 shadow-sm dark:bg-stone-950 dark:text-stone-200">
                      <Globe className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-stone-950 dark:text-stone-50">Existing website</span>
                      <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400">Use the structure of a site you already have</span>
                    </span>
                    <button
                      type="button"
                      disabled={!capabilities?.ai}
                      onClick={() => choose("competitor")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#214f43] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a3f36] disabled:opacity-50"
                    >
                      Build
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 py-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-stone-800 shadow-sm dark:bg-stone-950 dark:text-stone-200">
                      <PenLine className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-stone-950 dark:text-stone-50">Answer a few questions</span>
                      <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400">No profile, document, or existing website needed</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => choose("manual")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#214f43] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a3f36]"
                    >
                      Build
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <ComingSoonNotify />
          <SupportBot
            canCreate={!verified || canCreate}
            onChoose={choose}
            onAnalyzed={onAnalyzed}
            onLimitReached={(message) => {
              setError(message);
              setStep("limit");
            }}
          />
        </div>
      ) : (
        <div className="relative mx-auto w-full max-w-6xl min-w-0 px-4 pb-28 pt-6 sm:px-6 sm:pb-24 sm:pt-12">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative mt-2 w-full min-w-0 sm:mt-4"
          >
            <div className="relative w-full min-w-0">
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
                onBack={() => setStep("source")}
                onConfirm={confirmAnalysis}
              />
            ) : null}

            {step === "review" ? (
              <div className="flex w-full min-w-0 flex-col gap-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#214f43] dark:text-[#9cc2b3]">PaperChai studio</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-[-0.025em] text-[#11130f] dark:text-stone-50">
                      {editingSiteId ? "Edit your site" : "Build your site"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {editingSiteId
                        ? "Update your details and republish — your live URL stays the same."
                        : initialValues
                          ? "Change only what you need, then update the preview."
                          : "Choose your site type, look, and details — see what you'll get as you go."}
                    </p>
                    {editingSiteId && slug ? (
                      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                        {getPublicSiteUrl(slug, { host: window.location.host }).replace(
                          /^https?:\/\//,
                          ""
                        )}
                      </p>
                    ) : null}
                    {verifiedEmail ? (
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="break-all text-xs text-muted-foreground/80">
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
                  {editingSiteId ? (
                    <Link
                      href="/dashboard"
                      className="flex shrink-0 items-center gap-1.5 self-start text-sm text-stone-500 transition-colors hover:text-[#11130f] dark:text-stone-400 dark:hover:text-white"
                    >
                      <ArrowLeft className="size-4" />
                      My sites
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStep("chooser")}
                      className="flex shrink-0 items-center gap-1.5 self-start text-sm text-stone-500 transition-colors hover:text-[#11130f] dark:text-stone-400 dark:hover:text-white"
                    >
                      <ArrowLeft className="size-4" />
                      Start over
                    </button>
                  )}
                </div>
                <BuilderForm
                  key={`${editingSiteId ?? "new"}-${JSON.stringify(initialValues ?? {})}`}
                  onGenerate={handleGenerate}
                  generating={false}
                  error={error}
                  initialValues={initialValues}
                  aiAvailable={Boolean(capabilities?.ai && editingSiteId)}
                  editMode={Boolean(editingSiteId)}
                  initialStep={initialValues ? 3 : 1}
                />
              </div>
            ) : null}

            {step === "verify" ? (
              <EmailGate
                intent="generate"
                onBack={() => setStep(site && !editingSiteId ? "preview" : "review")}
                onVerified={(email) => {
                  setVerified(true);
                  setVerifiedEmail(email);
                  fetch("/api/auth/session")
                    .then((r) => (r.ok ? r.json() : null))
                    .then((data: { canCreate?: boolean; limitReason?: string } | null) => {
                      const allowed = data?.canCreate !== false;
                      setCanCreate(allowed);
                      if (!allowed && !editingSiteId) {
                        setError(
                          data?.limitReason ??
                            "You've used your free site. Delete one in My sites or upgrade to Basic."
                        );
                        setStep("limit");
                        return;
                      }
                      if (pendingInput) {
                        void doGenerate(pendingInput);
                        return;
                      }
                      if (editSiteId) {
                        setEditLoading(true);
                        fetch(`/api/sites/${encodeURIComponent(editSiteId)}`)
                          .then(async (res) => {
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) {
                              setEditLoadError(
                                (data.error as string) ?? "This site could not be loaded."
                              );
                              return;
                            }
                            const loadedSite = data.site as SiteData;
                            setEditingSiteId(data.id as string);
                            setSlug(data.slug as string);
                            setSite(loadedSite);
                            setInitialValues(siteToGeneratorInput(loadedSite));
                            setStep("review");
                          })
                          .finally(() => setEditLoading(false));
                        return;
                      }
                      setStep("review");
                    })
                    .catch(() => {
                      if (pendingInput) void doGenerate(pendingInput);
                      else setStep("review");
                    });
                }}
              />
            ) : null}

            {step === "generating" ? (
              <GeneratingOverlay
                useAI={Boolean(capabilities?.ai && pendingInput?.useAI !== false)}
                editMode={Boolean(editingSiteId)}
              />
            ) : null}

            {step === "limit" ? (
              <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 rounded-[1.5rem] border border-[#11130f]/10 bg-white/80 px-6 py-10 text-center shadow-[0_30px_80px_-55px_rgba(17,19,15,0.5)] dark:border-white/10 dark:bg-[#151815]/90">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[#dce8e2] p-2 dark:bg-[#214f43]/20">
                  <LogoMark size={40} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#214f43] dark:text-[#9cc2b3]">Free plan</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#11130f] dark:text-stone-50">You&apos;ve used your free site</h2>
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
