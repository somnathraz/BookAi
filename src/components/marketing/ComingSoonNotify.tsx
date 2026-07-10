"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BellRing,
  Check,
  Facebook,
  FileText,
  Github,
  Globe,
  Instagram,
  Languages,
  Linkedin,
  Loader2,
  NotebookText,
  Youtube,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const EASE = [0.22, 1, 0.36, 1] as const;

interface UpcomingSource {
  id: string;
  icon: LucideIcon;
  label: string;
  hint: string;
}

const UPCOMING: UpcomingSource[] = [
  { id: "instagram", icon: Instagram, label: "Instagram", hint: "Build from your posts and bio" },
  { id: "website", icon: Globe, label: "Existing website", hint: "Import and modernise your old site" },
  { id: "resume", icon: FileText, label: "Resume & brochure", hint: "Upload a PDF, card, or brochure" },
  { id: "youtube", icon: Youtube, label: "YouTube channel", hint: "Videos, channel art, and stats" },
  { id: "facebook", icon: Facebook, label: "Facebook Page", hint: "Page info, posts, and reviews" },
  { id: "linkedin", icon: Linkedin, label: "LinkedIn", hint: "Profile, roles, and skills" },
  { id: "notion", icon: NotebookText, label: "Notion", hint: "Turn a Notion page into a site" },
  { id: "github", icon: Github, label: "GitHub", hint: "Repos, readme, and contributions" },
  { id: "languages", icon: Languages, label: "Hindi & regional", hint: "Sites in the language you sell in" },
];

type ItemState = "idle" | "sending" | "done";

/**
 * "Coming soon" import sources with a Notify-me vote per source, so we can
 * measure which source to build next. Votes go to /api/notify.
 */
export function ComingSoonNotify() {
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [states, setStates] = useState<Record<string, ItemState>>({});

  async function notify(id: string) {
    if (states[id] === "sending" || states[id] === "done") return;
    setStates((s) => ({ ...s, [id]: "sending" }));
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: id, email: email.trim() || undefined }),
      });
      setStates((s) => ({ ...s, [id]: res.ok ? "done" : "idle" }));
    } catch {
      setStates((s) => ({ ...s, [id]: "idle" }));
    }
  }

  return (
    <section className="relative mx-auto mt-24 max-w-6xl px-5 sm:px-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: EASE }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Coming soon
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            More ways to import your business
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Google Business and manual briefs are live today. Tell us which
            source you want next — the most-requested one ships first.
          </p>
        </div>
        <Input
          type="email"
          inputMode="email"
          placeholder="Email for launch updates (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 w-full bg-background/70 backdrop-blur sm:w-72"
        />
      </motion.div>

      <motion.ul
        initial={reduce ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        className="mt-8 grid gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 dark:border-white/10 dark:bg-white/10 sm:grid-cols-2 lg:grid-cols-3"
      >
        {UPCOMING.map(({ id, icon: Icon, label, hint }) => {
          const state = states[id] ?? "idle";
          return (
            <motion.li
              key={id}
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
              }}
              className="group flex items-center gap-3 bg-background/80 p-4 backdrop-blur transition-colors hover:bg-background dark:bg-background/50 dark:hover:bg-background/70"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background/70 text-foreground transition-transform duration-300 group-hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.04]">
                <Icon className="size-4.5" strokeWidth={1.7} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{label}</span>
                <span className="block truncate text-xs text-muted-foreground">{hint}</span>
              </span>
              <button
                type="button"
                onClick={() => void notify(id)}
                disabled={state !== "idle"}
                aria-label={`Notify me when ${label} import launches`}
                className={cn(
                  "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all",
                  state === "done"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-border/80 bg-background/70 text-foreground hover:border-foreground/30 hover:bg-accent dark:border-white/15"
                )}
              >
                {state === "done" ? (
                  <>
                    <Check className="size-3.5" />
                    Noted
                  </>
                ) : state === "sending" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <BellRing className="size-3.5" />
                    Notify me
                  </>
                )}
              </button>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}
