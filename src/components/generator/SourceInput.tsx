"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Globe,
  Linkedin,
  Loader2,
  MapPin,
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
    blurb: "Paste your Google Maps business link. We pull real reviews & details.",
    kind: "url",
    placeholder: "https://maps.google.com/…  or  https://maps.app.goo.gl/…",
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

export function SourceInput({
  source,
  onBack,
  onAnalyzed,
}: {
  source: Exclude<SourceId, "manual">;
  onBack: () => void;
  onAnalyzed: (analysis: AnalysisResult) => void;
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

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const form = new FormData();
    form.append("file", file);
    run(form, true);
  }

  const canSubmit =
    cfg.kind === "url" ? url.trim().length > 3 : text.trim().length > 10;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Choose a different source
      </button>

      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card">
          <Icon className="size-5" strokeWidth={1.6} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{cfg.title}</h2>
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
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={cfg.placeholder}
          inputMode="url"
        />
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
