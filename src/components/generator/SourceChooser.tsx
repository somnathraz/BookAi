"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Globe,
  Lock,
  MapPin,
  PenLine,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Capabilities, SourceId } from "@/lib/types";

export type { Capabilities, SourceId };

interface SourceDef {
  id: SourceId;
  icon: LucideIcon;
  title: string;
  description: string;
  best: string;
  enabled: (c: Capabilities) => boolean;
  disabledHint: string;
}

const SOURCES: SourceDef[] = [
  {
    id: "maps",
    icon: MapPin,
    title: "Google Business reviews",
    description: "Paste a Maps link and build from reviews, photos, location, and hours.",
    best: "Most specific",
    enabled: (c) => c.google,
    disabledHint: "Needs Google Places",
  },
  {
    id: "resume",
    icon: FileText,
    title: "Resume or LinkedIn PDF",
    description: "Upload a CV or paste profile text. We structure roles, skills, and proof.",
    best: "Profiles & freelancers",
    enabled: (c) => c.ai,
    disabledHint: "Coming soon",
  },
  {
    id: "competitor",
    icon: Globe,
    title: "Reference site",
    description: "Start from a website's shape without copying its words.",
    best: "For early drafts",
    enabled: (c) => c.ai,
    disabledHint: "Coming soon",
  },
  {
    id: "manual",
    icon: PenLine,
    title: "Manual brief",
    description: "Type only the essentials, then review every section before publishing.",
    best: "Always available",
    enabled: () => true,
    disabledHint: "",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function SourceChooser({
  capabilities,
  canCreate = true,
  onChoose,
}: {
  capabilities: Capabilities;
  /** When false (free site already used), smart imports are disabled. */
  canCreate?: boolean;
  onChoose: (source: SourceId) => void;
}) {
  const smartOff = !capabilities.ai && !capabilities.google;
  const atSiteLimit = !canCreate;

  return (
    <div className="space-y-4">
      {atSiteLimit ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100/90">
          You&apos;ve used your free site. Smart imports are disabled so we don&apos;t
          run paid APIs again — delete a site in{" "}
          <a href="/dashboard" className="font-medium underline underline-offset-2">
            My sites
          </a>{" "}
          or upgrade to create another.
        </div>
      ) : smartOff ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100/90">
          Smart imports are not enabled here. Start with a manual brief.
        </div>
      ) : null}

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        className="grid gap-3 sm:grid-cols-2"
      >
        {SOURCES.map((s) => {
          const enabled = s.id === "manual" ? true : canCreate && s.enabled(capabilities);
          const Icon = s.icon;
          return (
            <motion.button
              key={s.id}
              variants={fadeUp}
              whileHover={enabled ? { y: -3 } : undefined}
              whileTap={enabled ? { scale: 0.985 } : undefined}
              type="button"
              disabled={!enabled}
              onClick={() => enabled && onChoose(s.id)}
              className={cn(
                "group relative flex min-h-40 flex-col overflow-hidden rounded-lg border p-4 text-left transition-all",
                enabled
                  ? "border-border/70 bg-background/60 backdrop-blur-xl hover:border-foreground/20 hover:bg-background/80 dark:border-white/10 dark:bg-background/50 dark:hover:border-white/25 dark:hover:bg-background/70"
                  : "cursor-not-allowed border-dashed border-border/60 bg-background/45 opacity-75 dark:border-white/10 dark:bg-background/30"
              )}
            >
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.045),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.09),transparent_45%)]" />
              <div className="relative mb-4 flex items-start justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg border border-border/70 bg-background/60 text-foreground dark:border-white/10 dark:bg-white/[0.04]">
                  <Icon className="size-5" strokeWidth={1.6} />
                </span>
                {!enabled ? (
                  <span className="flex items-center gap-1 rounded-md border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground dark:border-white/10 dark:bg-white/[0.04]">
                    <Lock className="size-3" />
                    Soon
                  </span>
                ) : (
                  <Badge
                    variant="secondary"
                    className="rounded-md bg-foreground/10 text-[11px] font-medium text-foreground hover:bg-foreground/10 dark:bg-white/10 dark:hover:bg-white/10"
                  >
                    {s.best}
                  </Badge>
                )}
              </div>
              <div className="relative flex flex-1 flex-col">
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                  {s.description}
                </p>
                <span className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium text-foreground">
                  {enabled ? "Start from this" : s.disabledHint}
                  {enabled ? (
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  ) : null}
                </span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
