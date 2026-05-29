"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const STEPS = [
  "Understanding your details",
  "Choosing the right layout",
  "Writing your copy",
  "Composing your sections",
  "Applying your theme",
];

export function GeneratingOverlay({ useAI }: { useAI: boolean }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((a) => Math.min(a + 1, STEPS.length - 1));
    }, useAI ? 1600 : 600);
    return () => clearInterval(t);
  }, [useAI]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6 py-8 text-center"
    >
      <div className="relative flex size-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-foreground/10" />
        <Loader2 className="size-8 animate-spin text-foreground" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">Building your site…</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {useAI ? "Writing it from your details." : "Assembling your template."}
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2.5">
        {STEPS.map((step, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-3 text-sm transition-colors",
                done || current ? "text-foreground" : "text-muted-foreground/50"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  done
                    ? "border-foreground bg-foreground text-background"
                    : current
                      ? "border-foreground"
                      : "border-muted-foreground/30"
                )}
              >
                {done ? (
                  <Check className="size-3" />
                ) : current ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : null}
              </span>
              {step}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
