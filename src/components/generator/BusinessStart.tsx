"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardPaste,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { AnalysisResult, Capabilities } from "@/lib/types";
import type { BusinessSearchResult } from "@/lib/business-search";

type Mode = "search" | "paste" | "help";

const EASE = [0.22, 1, 0.36, 1] as const;

function mapsSearchUrl(query: string): string {
  const params = new URLSearchParams({ api: "1", query });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function isMapsUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return (
      host === "maps.app.goo.gl" ||
      host === "goo.gl" ||
      host === "maps.google.com" ||
      host === "www.google.com" ||
      host.endsWith(".google.com")
    );
  } catch {
    return false;
  }
}

export function BusinessStart({
  capabilities,
  canCreate,
  onManual,
  onAnalyzed,
  onLimitReached,
}: {
  capabilities: Capabilities;
  canCreate: boolean;
  onManual: () => void;
  onAnalyzed: (analysis: AnalysisResult) => void;
  onLimitReached: (message: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [results, setResults] = useState<BusinessSearchResult[]>([]);
  const [selected, setSelected] = useState<BusinessSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openedMaps, setOpenedMaps] = useState(false);
  const [returnedFromMaps, setReturnedFromMaps] = useState(false);

  const mapsHref = useMemo(
    () => mapsSearchUrl(query.trim() || "business near me"),
    [query]
  );

  useEffect(() => {
    function onVisibilityChange() {
      if (openedMaps && document.visibilityState === "visible") {
        setReturnedFromMaps(true);
        setMode("paste");
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [openedMaps]);

  async function searchBusinesses(event: React.FormEvent) {
    event.preventDefault();
    if (searching || query.trim().length < 3) return;
    setError(null);
    setSelected(null);
    setResults([]);

    if (!capabilities.businessSearch) {
      setMode("help");
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/business-search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (res.status === 429) {
        setError(data.error as string);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Could not search businesses.");
      const nextResults = (data.results ?? []) as BusinessSearchResult[];
      setResults(nextResults);
      if (!nextResults.length) setMode("help");
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Could not search businesses."
      );
    } finally {
      setSearching(false);
    }
  }

  async function importBusiness(url: string) {
    if (importing || !isMapsUrl(url.trim())) {
      setError("Paste a valid Google Maps share link.");
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "maps", url: url.trim() }),
      });
      const data = await res.json();
      if (res.status === 402 && data?.code === "limit_reached") {
        onLimitReached(data.error as string);
        return;
      }
      if (res.status === 429 && data?.code === "rate_limited") {
        setError(data.error as string);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Could not import that business.");
      onAnalyzed(data.analysis as AnalysisResult);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Could not import that business."
      );
    } finally {
      setImporting(false);
    }
  }

  async function pasteFromClipboard() {
    setError(null);
    try {
      const value = await navigator.clipboard.readText();
      if (!isMapsUrl(value.trim())) {
        setError("No Google Maps link found. Tap Share, then Copy link in Google Maps.");
        return;
      }
      setMapsUrl(value.trim());
      await importBusiness(value.trim());
    } catch {
      setError("Clipboard access was blocked. Press and hold the field to paste the link.");
    }
  }

  if (!canCreate) {
    return (
      <div className="rounded-2xl border border-[#214f43]/20 bg-[#dce8e2] p-4 text-sm text-[#173b32]">
        You have used your free site. Delete one in My sites or upgrade to create
        another.
      </div>
    );
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        {mode === "search" ? (
          <motion.div
            key="search"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <form onSubmit={searchBusinesses}>
              <label htmlFor="business-search" className="sr-only">
                Business name and city
              </label>
              <div className="group flex min-h-16 items-center gap-3 rounded-2xl border border-[#11130f]/15 bg-white p-2 shadow-[0_18px_50px_-30px_rgba(17,19,15,0.48)] transition focus-within:border-[#214f43]/55 focus-within:shadow-[0_20px_55px_-30px_rgba(33,79,67,0.5)] dark:border-white/15 dark:bg-[#151815]">
                <Search className="ml-3 size-5 shrink-0 text-stone-500" />
                <input
                  id="business-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Business name and city"
                  autoComplete="organization"
                  className="min-w-0 flex-1 bg-transparent py-3 text-base text-stone-950 outline-none placeholder:text-stone-400 dark:text-stone-50 sm:text-lg"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={searching || query.trim().length < 3}
                  className="h-12 shrink-0 rounded-xl bg-[#214f43] px-4 text-white hover:bg-[#173b32] sm:px-5"
                >
                  {searching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <span className="hidden sm:inline">Find my business</span>
                      <span className="sm:hidden">Find</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setMode("paste");
                  setError(null);
                }}
                className="font-medium text-stone-700 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-950 dark:text-stone-300 dark:hover:text-white"
              >
                Already have a Google Maps link?
              </button>
              <button
                type="button"
                onClick={onManual}
                className="text-stone-600 transition hover:text-stone-950 dark:text-stone-400 dark:hover:text-white"
              >
                No Google profile? Tell us about your business
              </button>
            </div>

            <AnimatePresence initial={false}>
              {results.length ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, height: 0, y: 10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 overflow-hidden rounded-2xl border border-stone-900/10 bg-white/88 shadow-xl shadow-stone-900/5 backdrop-blur dark:border-white/10 dark:bg-stone-950/85"
                >
                  <div className="border-b border-stone-900/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:border-white/10">
                    Choose your business
                  </div>
                  <div className="divide-y divide-stone-900/10 dark:divide-white/10">
                    {results.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => setSelected(result)}
                        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-[#edf2ef] dark:hover:bg-white/[0.04]"
                      >
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#dce8e2] text-[#214f43] dark:bg-[#9cc2b3]/10 dark:text-[#9cc2b3]">
                          <MapPin className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-stone-950 dark:text-stone-50">
                            {result.name}
                          </span>
                          <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400">
                            {[result.category, result.address].filter(Boolean).join(" - ")}
                          </span>
                        </span>
                        {typeof result.rating === "number" ? (
                          <span className="mt-1 flex shrink-0 items-center gap-1 text-sm font-medium text-stone-700 dark:text-stone-300">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            {result.rating.toFixed(1)}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : mode === "paste" ? (
          <motion.div
            key="paste"
            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="rounded-2xl border border-[#11130f]/10 bg-white p-4 shadow-[0_18px_50px_-30px_rgba(17,19,15,0.45)] dark:border-white/10 dark:bg-[#151815] sm:p-5"
          >
            <button
              type="button"
              onClick={() => setMode("search")}
              className="mb-4 flex items-center gap-1.5 text-sm text-stone-500 transition hover:text-stone-950 dark:hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Search by name instead
            </button>
            <p className="font-semibold text-stone-950 dark:text-stone-50">
              {returnedFromMaps ? "Link copied? Paste it here." : "Paste your Google Maps link"}
            </p>
            <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">
              Use the Share link from your business listing so we import the right location.
            </p>
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void importBusiness(mapsUrl);
              }}
            >
              <input
                value={mapsUrl}
                onChange={(event) => setMapsUrl(event.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                inputMode="url"
                className="h-12 min-w-0 flex-1 rounded-xl border border-stone-900/15 bg-white px-4 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[#214f43]/55 dark:border-white/15 dark:bg-stone-900 dark:text-white"
              />
              <Button
                type="submit"
                size="lg"
                disabled={importing || !isMapsUrl(mapsUrl.trim())}
                className="h-12 rounded-xl bg-[#214f43] text-white hover:bg-[#173b32]"
              >
                {importing ? <Loader2 className="size-4 animate-spin" /> : "Create my site"}
              </Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void pasteFromClipboard()}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/[0.06]"
              >
                <ClipboardPaste className="size-4" />
                Paste copied link
              </button>
              <button
                type="button"
                onClick={() => setMode("help")}
                className="rounded-lg px-2 py-1.5 text-sm text-stone-500 transition hover:text-stone-950 dark:hover:text-white"
              >
                Show me how
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="help"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="rounded-2xl border border-[#11130f]/10 bg-white p-4 shadow-[0_18px_50px_-30px_rgba(17,19,15,0.45)] dark:border-white/10 dark:bg-[#151815] sm:p-5"
          >
            <button
              type="button"
              onClick={() => setMode("search")}
              className="mb-4 flex items-center gap-1.5 text-sm text-stone-500 transition hover:text-stone-950 dark:hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
            <p className="font-semibold text-stone-950 dark:text-stone-50">
              Find your business on Google Maps
            </p>
            <ol className="mt-4 space-y-3 text-sm text-stone-600 dark:text-stone-300">
              {["Open your business listing", "Tap Share, then Copy link", "Return to PaperChai and paste it"].map(
                (step, index) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-stone-950 text-xs font-semibold text-white dark:bg-stone-100 dark:text-stone-950">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                )
              )}
            </ol>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpenedMaps(true)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#214f43] px-5 text-sm font-semibold text-white transition hover:bg-[#173b32]"
              >
                Open Google Maps
                <ExternalLink className="size-4" />
              </a>
              <button
                type="button"
                onClick={() => setMode("paste")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-stone-900/15 px-5 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 dark:border-white/15 dark:text-stone-200 dark:hover:bg-white/[0.06]"
              >
                <ClipboardPaste className="size-4" />
                Paste copied link
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <AnimatePresence>
        {selected ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end justify-center bg-stone-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.3, ease: EASE }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl bg-[#f3f3ef] p-5 shadow-2xl dark:bg-[#111311] sm:rounded-3xl sm:p-6"
            >
              <div className="flex size-11 items-center justify-center rounded-full bg-[#dce8e2] text-[#214f43] dark:bg-[#9cc2b3]/10 dark:text-[#9cc2b3]">
                <Check className="size-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-stone-950 dark:text-white">
                Is this your business?
              </h2>
              <div className="mt-5 border-y border-stone-900/10 py-4 dark:border-white/10">
                <p className="font-semibold text-stone-950 dark:text-white">{selected.name}</p>
                <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">
                  {selected.address}
                </p>
                {typeof selected.rating === "number" ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    {selected.rating.toFixed(1)}
                    {selected.reviewCount ? ` - ${selected.reviewCount} reviews` : ""}
                  </p>
                ) : null}
              </div>
              {error ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                  {error}
                </p>
              ) : null}
              <Button
                size="lg"
                disabled={importing}
                onClick={() => void importBusiness(selected.mapsUrl)}
                className="mt-5 h-12 w-full rounded-xl bg-[#214f43] text-white hover:bg-[#173b32]"
              >
                {importing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Importing your business
                  </>
                ) : (
                  <>
                    Yes, create my website
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mt-3 w-full py-2 text-sm text-stone-500 transition hover:text-stone-950 dark:hover:text-white"
              >
                No, choose another
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
