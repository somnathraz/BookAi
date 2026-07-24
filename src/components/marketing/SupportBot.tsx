"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Loader2,
  MapPin,
  MessageCircle,
  Send,
  X,
} from "lucide-react";

import { MapsFindHelp } from "@/components/generator/MapsFindHelp";
import type { AnalysisResult, SourceId } from "@/lib/types";
import type { BusinessSearchResult } from "@/lib/business-search";
import { ApiClientError, apiClient } from "@/platform/api/api-client";

const SUPPORT_WHATSAPP = "917008257342";
const WA_URL = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
  "Hi PaperChai — I need help creating my website."
)}`;
const IDLE_NUDGE_MS = 14000;

type Path =
  | "google"
  | "resume"
  | "website"
  | "manual"
  | "human"
  | null;

type Msg = {
  id: string;
  role: "bot" | "user";
  text: string;
};

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

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

let msgCount = 0;
function mid() {
  msgCount += 1;
  return `m-${msgCount}`;
}

/**
 * Simple guided support bot for the homepage.
 * Helps confused users pick a path and can take input to start building a site.
 */
export function SupportBot({
  onChoose,
  onAnalyzed,
  onLimitReached,
  canCreate = true,
}: {
  onChoose: (source: SourceId) => void;
  onAnalyzed: (result: AnalysisResult) => void;
  onLimitReached: (message: string) => void;
  canCreate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [path, setPath] = useState<Path>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: mid(),
      role: "bot",
      text: "Hi — stuck on how to start? I can guide you and even build from what you paste.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<BusinessSearchResult[]>([]);
  const [mapsHelpQuery, setMapsHelpQuery] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dismissedNudge = useRef(false);

  useEffect(() => {
    if (open || dismissedNudge.current) return;
    const timer = window.setTimeout(() => setNudge(true), IDLE_NUDGE_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, results, mapsHelpQuery, busy, open]);

  function push(role: Msg["role"], text: string) {
    setMessages((prev) => [...prev, { id: mid(), role, text }]);
  }

  function openPanel() {
    setOpen(true);
    setNudge(false);
    dismissedNudge.current = true;
  }

  function closePanel() {
    setOpen(false);
  }

  function dismissNudge() {
    setNudge(false);
    dismissedNudge.current = true;
  }

  function resetChat() {
    setPath(null);
    setInput("");
    setResults([]);
    setMapsHelpQuery(null);
    setBusy(false);
    setMessages([
      {
        id: mid(),
        role: "bot",
        text: "What do you already have? Pick one and I’ll take it from there.",
      },
    ]);
  }

  function pickPath(next: Path) {
    setResults([]);
    setMapsHelpQuery(null);
    setPath(next);

    if (next === "google") {
      push("user", "I have a Google / local business");
      push(
        "bot",
        "Perfect. Type your business name and city, or paste a Google Maps share link (maps.app.goo.gl/…)."
      );
      return;
    }
    if (next === "website") {
      push("user", "I have an existing website");
      push("bot", "Paste the website URL and I’ll analyze it to start your site.");
      return;
    }
    if (next === "resume") {
      push("user", "I have a resume or CV");
      if (!canCreate) {
        push("bot", "You’ve used your free site. Delete one in My sites or upgrade to continue.");
        return;
      }
      push("bot", "Opening the resume builder for you…");
      window.setTimeout(() => onChoose("resume"), 450);
      return;
    }
    if (next === "manual") {
      push("user", "I’ll answer a few questions");
      push("bot", "Opening the guided form…");
      window.setTimeout(() => onChoose("manual"), 450);
      return;
    }
    if (next === "human") {
      push("user", "I want to talk to a person");
      push("bot", "Opening WhatsApp support — we’ll help you finish your site.");
      window.setTimeout(() => {
        window.open(WA_URL, "_blank", "noopener,noreferrer");
      }, 400);
    }
  }

  async function importMaps(url: string) {
    setBusy(true);
    try {
      const data = await apiClient.post<{ analysis: AnalysisResult }>("/api/extract", {
        body: { source: "maps", url },
      });
      push("bot", "Got it — building your preview now…");
      onAnalyzed(data.analysis);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 402) {
        push("bot", error.message);
        onLimitReached(error.message);
        return;
      }
      push(
        "bot",
        error instanceof Error
          ? error.message
          : "Could not import that business. Try another link or WhatsApp support."
      );
    } finally {
      setBusy(false);
    }
  }

  async function importWebsite(url: string) {
    setBusy(true);
    try {
      const data = await apiClient.post<{ analysis: AnalysisResult }>("/api/extract", {
        body: { source: "competitor", url },
      });
      push("bot", "Analyzed — opening your draft…");
      onAnalyzed(data.analysis);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 402) {
        push("bot", error.message);
        onLimitReached(error.message);
        return;
      }
      push(
        "bot",
        error instanceof Error
          ? error.message
          : "Could not analyze that site. Try again or pick another path."
      );
    } finally {
      setBusy(false);
    }
  }

  async function searchBusiness(query: string) {
    setBusy(true);
    setResults([]);
    setMapsHelpQuery(null);
    try {
      const data = await apiClient.get<{ results: BusinessSearchResult[] }>(
        `/api/business-search?q=${encodeURIComponent(query)}`
      );
      const next = data.results ?? [];
      if (!next.length) {
        setMapsHelpQuery(query);
        push(
          "bot",
          "We couldn’t find that business here. Follow the exact steps below in the Google Maps app, copy the Share link, then paste it in the chat."
        );
        return;
      }
      setResults(next.slice(0, 5));
      push("bot", "Pick your business below and I’ll build the site.");
    } catch (error) {
      setMapsHelpQuery(query);
      push(
        "bot",
        error instanceof Error
          ? `${error.message} Use the Maps steps below, or paste a Maps share link.`
          : "Search unavailable. Use the Maps steps below, or paste a Google Maps share link."
      );
    } finally {
      setBusy(false);
    }
  }

  async function selectBusiness(item: BusinessSearchResult) {
    push("user", item.name);
    setResults([]);
    push("bot", `Importing ${item.name}…`);
    await importMaps(item.mapsUrl);
  }

  async function submitInput(event: React.FormEvent) {
    event.preventDefault();
    const value = input.trim();
    if (!value || busy) return;
    if (!canCreate && (path === "google" || path === "website")) {
      push("bot", "You’ve used your free site. Delete one in My sites or upgrade.");
      return;
    }

    setInput("");
    push("user", value);

    if (path === "google") {
      if (isMapsUrl(value)) {
        setMapsHelpQuery(null);
        push("bot", "Importing from Google Maps…");
        await importMaps(value);
        return;
      }
      if (value.length < 3) {
        push("bot", "Add a bit more — business name and city works best.");
        return;
      }
      push("bot", "Searching Google for your business…");
      await searchBusiness(value);
      return;
    }

    if (path === "website") {
      const url = looksLikeUrl(value) ? value : `https://${value}`;
      push("bot", "Analyzing that website…");
      await importWebsite(url);
    }
  }

  const showInput = path === "google" || path === "website";
  const showPaths = path === null && !busy;

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {nudge && !open ? (
        <div className="relative max-w-[16.5rem] rounded-2xl border border-[#11130f]/10 bg-white px-4 py-3 text-sm text-[#11130f] shadow-[0_18px_50px_-24px_rgba(17,19,15,0.55)] dark:border-white/10 dark:bg-[#151815] dark:text-stone-50">
          <button
            type="button"
            onClick={dismissNudge}
            className="absolute right-2 top-2 rounded-md p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
          <p className="pr-5 font-medium">Need help creating your site?</p>
          <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
            Tell me what you have — Google listing, resume, or a website — and I’ll start the build.
          </p>
          <button
            type="button"
            onClick={openPanel}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#214f43] dark:text-[#9cc2b3]"
          >
            Open guide
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      ) : null}

      {open ? (
        <div className="flex h-[min(32rem,72svh)] w-[min(22.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[1.35rem] border border-[#11130f]/10 bg-[#f7f7f3] shadow-[0_28px_80px_-28px_rgba(17,19,15,0.55)] dark:border-white/10 dark:bg-[#121412]">
          <div className="flex items-center justify-between gap-3 border-b border-[#11130f]/10 bg-[#214f43] px-4 py-3 text-white dark:border-white/10">
            <div className="min-w-0">
              <p className="text-sm font-semibold">PaperChai guide</p>
              <p className="text-[11px] text-white/65">Build your site step by step</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetChat}
                className="rounded-lg px-2 py-1 text-[11px] font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Restart
              </button>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label="Close guide"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-5 ${
                    msg.role === "user"
                      ? "rounded-br-md bg-[#214f43] text-white"
                      : "rounded-bl-md border border-[#11130f]/8 bg-white text-stone-800 dark:border-white/10 dark:bg-[#1a1d1a] dark:text-stone-100"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {showPaths ? (
              <div className="flex flex-col gap-2 pt-1">
                {(
                  [
                    ["google", "Local business on Google"],
                    ["resume", "Resume or CV"],
                    ["website", "Existing website"],
                    ["manual", "Answer a few questions"],
                    ["human", "Chat with a person on WhatsApp"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pickPath(id)}
                    className="rounded-xl border border-[#11130f]/10 bg-white px-3 py-2.5 text-left text-sm font-medium text-stone-800 transition hover:border-[#214f43]/35 hover:bg-[#dce8e2]/50 dark:border-white/10 dark:bg-[#1a1d1a] dark:text-stone-100 dark:hover:border-[#9cc2b3]/40"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

            {results.length > 0 ? (
              <div className="space-y-2">
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={busy}
                    onClick={() => void selectBusiness(item)}
                    className="flex w-full items-start gap-2 rounded-xl border border-[#11130f]/10 bg-white px-3 py-2.5 text-left transition hover:border-[#214f43]/35 disabled:opacity-60 dark:border-white/10 dark:bg-[#1a1d1a]"
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-[#214f43] dark:text-[#9cc2b3]" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-stone-900 dark:text-stone-50">
                        {item.name}
                      </span>
                      <span className="mt-0.5 block text-xs leading-4 text-stone-500 dark:text-stone-400">
                        {item.address}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {mapsHelpQuery ? (
              <div className="rounded-2xl border border-[#11130f]/10 bg-white p-3 dark:border-white/10 dark:bg-[#1a1d1a]">
                <MapsFindHelp query={mapsHelpQuery} />
                <p className="mt-3 text-[11px] leading-4 text-stone-500 dark:text-stone-400">
                  After you copy the link, paste it in the chat below.
                </p>
              </div>
            ) : null}

            {busy ? (
              <div className="flex items-center gap-2 px-1 text-xs text-stone-500 dark:text-stone-400">
                <Loader2 className="size-3.5 animate-spin" />
                Working on it…
              </div>
            ) : null}
          </div>

          {showInput ? (
            <form
              onSubmit={(e) => void submitInput(e)}
              className="border-t border-[#11130f]/10 bg-white/80 p-2.5 dark:border-white/10 dark:bg-[#151815]"
            >
              <div className="flex items-center gap-2 rounded-xl border border-[#11130f]/10 bg-white px-2.5 py-1.5 dark:border-white/10 dark:bg-[#0d0f0d]">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={busy}
                  placeholder={
                    path === "google"
                      ? "Name, city or Maps link"
                      : "https://yoursite.com"
                  }
                  className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-stone-400 dark:text-stone-100"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="flex size-8 items-center justify-center rounded-lg bg-[#214f43] text-white transition enabled:hover:bg-[#1a3f36] disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-stone-500 hover:text-[#214f43] dark:text-stone-400 dark:hover:text-[#9cc2b3]"
              >
                Prefer a human? WhatsApp support
              </a>
            </form>
          ) : (
            <div className="border-t border-[#11130f]/10 px-3 py-2.5 dark:border-white/10">
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-stone-500 hover:text-[#214f43] dark:text-stone-400 dark:hover:text-[#9cc2b3]"
              >
                WhatsApp support · 7008257342
              </a>
            </div>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        className="flex items-center gap-2 rounded-full bg-[#214f43] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_-8px_rgba(33,79,67,0.55)] transition hover:bg-[#1a3f36] active:scale-[0.98]"
        aria-label={open ? "Close support guide" : "Open support guide"}
      >
        {open ? <X className="size-4" /> : <MessageCircle className="size-4" />}
        {open ? "Close" : "Help me build"}
      </button>
    </div>
  );
}
