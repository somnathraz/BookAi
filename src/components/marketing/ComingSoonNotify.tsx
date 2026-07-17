"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BellRing,
  Check,
  Facebook,
  Github,
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
import { apiClient } from "@/platform/api/api-client";

const EASE = [0.22, 1, 0.36, 1] as const;

interface UpcomingSource {
  id: string;
  icon: LucideIcon;
  label: string;
  hint: string;
}

const UPCOMING: UpcomingSource[] = [
  { id: "instagram", icon: Instagram, label: "Instagram", hint: "Build from your posts and bio" },
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
      await apiClient.post("/api/notify", {
        body: { source: id, email: email.trim() || undefined },
      });
      setStates((s) => ({ ...s, [id]: "done" }));
    } catch {
      setStates((s) => ({ ...s, [id]: "idle" }));
    }
  }

  return (
    <section className="relative mx-auto mt-28 max-w-6xl px-5 sm:px-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: EASE }}
        className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#214f43] dark:text-[#9cc2b3]">
            Help choose what ships next
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Which source should PaperChai add next?
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Vote with one tap. Add your email only if you want a launch update
            when that source becomes available.
          </p>
        </div>
        <Input
          type="email"
          inputMode="email"
          placeholder="Email for launch updates (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full border-[#11130f]/15 bg-white dark:border-white/15 dark:bg-[#151815] lg:w-80"
        />
      </motion.div>

      <motion.ul
        initial={reduce ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-[#11130f]/10 bg-[#11130f]/10 dark:border-white/10 dark:bg-white/10 sm:grid-cols-2 lg:grid-cols-3"
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
              className="group flex items-center gap-3 bg-[#f8f8f4] p-4 transition-colors hover:bg-[#edf2ef] dark:bg-[#111311] dark:hover:bg-[#171a17]"
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
                    : "border-[#214f43]/25 bg-white text-[#214f43] hover:border-[#214f43]/50 hover:bg-[#dce8e2] dark:border-[#9cc2b3]/25 dark:bg-white/[0.04] dark:text-[#9cc2b3]"
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
                    Vote
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
