"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Globe,
  Lock,
  MapPin,
  PenLine,
  Sparkles,
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
    id: "resume",
    icon: FileText,
    title: "Resume, CV or LinkedIn",
    description:
      "Upload a PDF (incl. LinkedIn's “Save to PDF”) or paste the text. We extract your story.",
    best: "Professionals & freelancers",
    enabled: (c) => c.ai,
    disabledHint: "Needs an AI provider key",
  },
  {
    id: "maps",
    icon: MapPin,
    title: "Google Business",
    description: "Paste your Google Maps link — we pull real reviews & details.",
    best: "Local businesses & clinics",
    enabled: (c) => c.google,
    disabledHint: "Needs a Google Places key",
  },
  {
    id: "competitor",
    icon: Globe,
    title: "Reference site",
    description: "Paste any business site you like — we draft from its shape.",
    best: "When you have nothing yet",
    enabled: (c) => c.ai,
    disabledHint: "Needs an AI provider key",
  },
  {
    id: "manual",
    icon: PenLine,
    title: "Fill it in myself",
    description: "Skip imports and type your details into the form.",
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
  onChoose,
}: {
  capabilities: Capabilities;
  onChoose: (source: SourceId) => void;
}) {
  const smartOff = !capabilities.ai && !capabilities.google;

  return (
    <div>
      {smartOff ? (
        <div className="mb-6 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
          Smart imports need a provider key. Add{" "}
          <code className="rounded bg-black/30 px-1">ANTHROPIC_API_KEY</code> (or
          Gemini / OpenAI) to <code className="rounded bg-black/30 px-1">.env.local</code>{" "}
          to enable them — or just fill in the form below.
        </div>
      ) : (
        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-3.5" />
          {capabilities.provider ? (
            <span>
              Smart imports on via{" "}
              <span className="font-medium capitalize text-foreground">
                {capabilities.providers.find((p) => p.id === capabilities.provider)?.label ??
                  capabilities.provider}
              </span>
            </span>
          ) : (
            <span>Choose how to start</span>
          )}
        </div>
      )}

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {SOURCES.map((s) => {
          const enabled = s.enabled(capabilities);
          const Icon = s.icon;
          return (
            <motion.button
              key={s.id}
              variants={fadeUp}
              type="button"
              disabled={!enabled}
              onClick={() => enabled && onChoose(s.id)}
              className={cn(
                "group relative flex flex-col rounded-xl border p-5 text-left transition-all",
                enabled
                  ? "border-white/10 bg-card/60 backdrop-blur-xl hover:border-white/25 hover:bg-card/80"
                  : "cursor-not-allowed border-white/5 bg-card/30 opacity-60",
                s.id === "manual" && enabled && "sm:col-span-2 lg:col-span-1"
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <Icon className="size-6 text-foreground" strokeWidth={1.6} />
                {!enabled ? (
                  <Lock className="size-3.5 text-muted-foreground" />
                ) : null}
              </div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              <Badge
                variant="secondary"
                className="mt-3 w-fit rounded-full text-[11px] font-normal"
              >
                {enabled ? s.best : s.disabledHint}
              </Badge>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
