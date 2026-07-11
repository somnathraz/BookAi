"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  FileText,
  Globe,
  Link2,
  Linkedin,
  Loader2,
  MapPin,
  Monitor,
  Search,
  Share2,
  Smartphone,
  Upload,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AnalysisResult, SourceId } from "@/lib/types";

type InputKind = "url" | "paste" | "resume";

interface SourceConfig {
  icon: LucideIcon;
  title: string;
  blurb: string;
  kind: InputKind;
  placeholder: string;
  cta: string;
}

const CONFIG: Record<Exclude<SourceId, "manual">, SourceConfig> = {
  resume: {
    icon: FileText,
    title: "Resume, CV or LinkedIn",
    blurb:
      "Upload a PDF — including LinkedIn's “Save to PDF” export — or paste the text below. We'll structure it for you.",
    kind: "resume",
    placeholder: "Or paste your resume / LinkedIn profile text here…",
    cta: "Extract my profile",
  },
  maps: {
    icon: MapPin,
    title: "Import from Google Business",
    blurb: "Use the Share link from Google Maps — it pins the exact branch so we always pull the right location.",
    kind: "url",
    placeholder: "https://maps.app.goo.gl/…",
    cta: "Fetch business",
  },
  competitor: {
    icon: Globe,
    title: "Start from a reference site",
    blurb: "Paste any business website you like. We analyze its shape — not its words.",
    kind: "url",
    placeholder: "https://example.com",
    cta: "Analyze site",
  },
  linkedin: {
    icon: Linkedin,
    title: "Import from LinkedIn",
    blurb: "Paste your headline, About section and experience. (LinkedIn has no public API.)",
    kind: "paste",
    placeholder: "Paste your LinkedIn profile text here…",
    cta: "Extract from profile",
  },
};

// Only maps.app.goo.gl short links reliably carry the exact place_id.
// We still accept full maps.google.com URLs as a fallback, but the share
// link is the only format we can guarantee is accurate.
function isValidMapsShareUrl(url: string): boolean {
  return (
    url.startsWith("https://maps.app.goo.gl/") ||
    url.startsWith("http://maps.app.goo.gl/") ||
    url.startsWith("https://maps.google.com/") ||
    url.startsWith("https://www.google.com/maps/") ||
    url.startsWith("https://goo.gl/maps/")
  );
}

type StepDef = { icon: LucideIcon; title: string; detail: string };

const MOBILE_STEPS: StepDef[] = [
  {
    icon: Search,
    title: "Open the Google Maps app",
    detail: "Search for your business and tap on it to open the business card",
  },
  {
    icon: Share2,
    title: 'Tap "Share" on the business card',
    detail: 'Scroll down the bottom sheet and tap the Share button (arrow icon)',
  },
  {
    icon: Copy,
    title: 'Tap "Copy link"',
    detail: "You'll get a short maps.app.goo.gl/… link copied to your clipboard",
  },
  {
    icon: Link2,
    title: "Paste it below",
    detail: "We extract reviews, photos, hours, and location automatically",
  },
];

const DESKTOP_STEPS: StepDef[] = [
  {
    icon: Search,
    title: "Open maps.google.com",
    detail: "Search for your business and click on it in the results",
  },
  {
    icon: Share2,
    title: 'Click the Share button',
    detail: 'Click the Share icon (arrow icon) on the left panel of the business',
  },
  {
    icon: Copy,
    title: 'Click "Copy link"',
    detail: "You'll get a short maps.app.goo.gl/… link copied to your clipboard",
  },
  {
    icon: Link2,
    title: "Paste it below",
    detail: "We extract reviews, photos, hours, and location automatically",
  },
];

function MapsShareGuide({ url }: { url: string }) {
  const [tab, setTab] = useState<"mobile" | "desktop">("mobile");
  const hasUrl = url.length > 8;
  const isValid = isValidMapsShareUrl(url);
  const steps = tab === "mobile" ? MOBILE_STEPS : DESKTOP_STEPS;

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card/60">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border/60 bg-muted/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
        <p className="text-xs font-medium text-foreground">
          Only accepts Google Maps Share links
        </p>
        <span className="w-fit shrink-0 rounded-md border border-border/70 bg-background/80 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          maps.app.goo.gl/…
        </span>
      </div>

      {/* Mobile / Desktop tab toggle */}
      <div className="flex border-b border-border/60">
        {(["mobile", "desktop"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "mobile" ? (
              <Smartphone className="size-3.5" />
            ) : (
              <Monitor className="size-3.5" />
            )}
            {t === "mobile" ? "Mobile app" : "Desktop browser"}
          </button>
        ))}
      </div>

      {/* Steps */}
      <ol className="flex flex-col divide-y divide-border/50">
        {steps.map(({ icon: Icon, title, detail }, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
              {i + 1}
            </span>
            <div className="flex flex-1 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail}</p>
              </div>
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.6} />
            </div>
          </li>
        ))}
      </ol>

      {/* Live validation strip */}
      {hasUrl ? (
        <div
          className={
            isValid
              ? "flex items-center gap-2 border-t border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300"
              : "flex items-center gap-2 border-t border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive"
          }
        >
          <span
            className={`size-1.5 rounded-full ${isValid ? "bg-emerald-500" : "bg-destructive"}`}
          />
          {isValid
            ? "Looks good — this is a valid Google Maps link"
            : "This doesn't look like a maps.app.goo.gl Share link"}
        </div>
      ) : null}
    </div>
  );
}

export function SourceInput({
  source,
  onBack,
  onAnalyzed,
  onLimitReached,
}: {
  source: Exclude<SourceId, "manual">;
  onBack: () => void;
  onAnalyzed: (analysis: AnalysisResult) => void;
  onLimitReached?: (message: string) => void;
}) {
  const cfg = CONFIG[source];
  const Icon = cfg.icon;
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function run(body: BodyInit, isForm: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        ...(isForm ? {} : { headers: { "Content-Type": "application/json" } }),
        body,
      });
      const data = await res.json();
      if (res.status === 402 && data?.code === "limit_reached") {
        onLimitReached?.(data.error as string);
        return;
      }
      if (res.status === 429 && data?.code === "rate_limited") {
        setError(data.error as string);
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? "Extraction failed.");
      onAnalyzed(data.analysis as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (cfg.kind === "url") {
      run(JSON.stringify({ source, url }), false);
    } else {
      run(JSON.stringify({ source, text }), false);
    }
  }

  const MAX_FILE_MB = 5;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reject before even hitting the network — Vercel hard-kills requests > 4.5 MB.
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(
        `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_FILE_MB} MB. ` +
          "Try pasting the text instead."
      );
      // Reset so the same file can be re-selected after compression.
      e.target.value = "";
      return;
    }

    setFileName(file.name);
    const form = new FormData();
    form.append("file", file);
    run(form, true);
  }

  const canSubmit =
    cfg.kind === "url" ? url.trim().length > 3 : text.trim().length > 10;

  return (
    <form onSubmit={handleSubmit} className="flex w-full min-w-0 flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Choose a different source
      </button>

      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card">
          <Icon className="size-5" strokeWidth={1.6} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold sm:text-xl">{cfg.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{cfg.blurb}</p>
        </div>
      </div>

      {cfg.kind === "resume" ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-card/40 px-6 py-8 text-center transition-colors hover:border-white/30 hover:bg-card/60"
          >
            <Upload className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium">
              {fileName ?? "Upload a PDF (resume, CV or LinkedIn export)"}
            </span>
            <span className="text-xs text-muted-foreground">
              .pdf, .txt — or paste below
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain"
            onChange={handleFile}
            className="hidden"
          />
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={cfg.placeholder}
            rows={6}
          />
        </div>
      ) : cfg.kind === "paste" ? (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={cfg.placeholder}
          rows={8}
        />
      ) : (
        <>
          {source === "maps" ? (
            <MapsShareGuide url={url} />
          ) : null}
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={cfg.placeholder}
            inputMode="url"
            className={
              source === "maps" && url.length > 8 && !isValidMapsShareUrl(url)
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                : undefined
            }
          />
          {source === "maps" && url.length > 8 && !isValidMapsShareUrl(url) ? (
            <p className="-mt-2 text-xs text-destructive">
              Paste a <span className="font-medium">maps.app.goo.gl/…</span> Share link — regular Maps links may not work for businesses with multiple locations.
            </p>
          ) : null}
        </>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" size="lg" disabled={loading || !canSubmit}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Reading…
          </>
        ) : (
          <>
            {cfg.cta}
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
      <p className="-mt-1 text-center text-xs text-muted-foreground">
        You&apos;ll be able to review & edit everything before generating.
      </p>
    </form>
  );
}
