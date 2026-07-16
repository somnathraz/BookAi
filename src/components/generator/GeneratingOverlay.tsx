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

export function GeneratingOverlay({
  useAI,
  editMode = false,
}: {
  useAI: boolean;
  editMode?: boolean;
}) {
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
      className="mx-auto flex w-full max-w-lg flex-col items-center gap-7 rounded-[1.5rem] border border-[#11130f]/10 bg-white/80 px-6 py-10 text-center shadow-[0_30px_80px_-55px_rgba(17,19,15,0.5)] dark:border-white/10 dark:bg-[#151815]/90"
    >
      <div className="relative flex size-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#214f43]/10 dark:bg-[#9cc2b3]/10" />
        <Loader2 className="size-8 animate-spin text-[#214f43] dark:text-[#9cc2b3]" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#214f43] dark:text-[#9cc2b3]">PaperChai studio</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#11130f] dark:text-stone-50">
          {editMode ? "Updating your site…" : "Building your site…"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {editMode
            ? "Republishing to your live URL."
            : useAI
              ? "Writing it from your details."
              : "Assembling your template."}
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
                    ? "border-[#214f43] bg-[#214f43] text-white dark:border-[#9cc2b3] dark:bg-[#9cc2b3] dark:text-[#0d0f0d]"
                    : current
                      ? "border-[#214f43] text-[#214f43] dark:border-[#9cc2b3] dark:text-[#9cc2b3]"
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
