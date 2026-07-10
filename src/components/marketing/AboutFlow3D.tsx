"use client";

import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  CalendarCheck,
  Check,
  ClipboardList,
  Link2,
  MapPin,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  {
    id: "import",
    label: "Import",
    icon: MapPin,
    z: -40,
    x: "4%",
    y: "8%",
    w: "48%",
  },
  {
    id: "review",
    label: "Review",
    icon: ClipboardList,
    z: 20,
    x: "28%",
    y: "32%",
    w: "52%",
  },
  {
    id: "publish",
    label: "Publish",
    icon: CalendarCheck,
    z: 90,
    x: "38%",
    y: "14%",
    w: "58%",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

/**
 * Interactive 3-step pipeline for About: click a step (or hover on desktop)
 * to bring that layer forward in 3D — Maps import → review → live booking site.
 */
export function AboutFlow3D() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<StepId>("publish");

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 65, damping: 16, mass: 0.6 });
  const smy = useSpring(my, { stiffness: 65, damping: 16, mass: 0.6 });
  const rotateY = useTransform(smx, [-0.5, 0.5], [-9, 9]);
  const rotateX = useTransform(smy, [-0.5, 0.5], [7, -7]);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  function zFor(id: StepId): number {
    const base = STEPS.find((s) => s.id === id)!;
    return active === id ? base.z + 60 : base.z;
  }

  return (
    <div className="relative mx-auto w-full max-w-[34rem]">
      {/* step tabs */}
      <div className="mb-4 flex justify-center gap-2">
        {STEPS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            onMouseEnter={() => !reduce && setActive(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              active === id
                ? "border-foreground/30 bg-foreground text-background shadow-md"
                : "border-border/70 bg-background/70 text-muted-foreground hover:border-foreground/20 hover:text-foreground dark:border-white/12"
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative select-none"
        style={{ perspective: 1400 }}
        aria-hidden
      >
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative h-[400px] sm:h-[440px]"
        >
          <AnimatePresence mode="sync">
            {/* Step 1 — Maps import */}
            <motion.div
              key="import-panel"
              animate={{
                z: zFor("import"),
                opacity: active === "import" ? 1 : 0.72,
                scale: active === "import" ? 1 : 0.94,
              }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
              style={{
                transformStyle: "preserve-3d",
                left: STEPS[0].x,
                top: STEPS[0].y,
                width: STEPS[0].w,
              }}
              className="absolute"
            >
              <div className="rounded-xl border border-border/70 bg-background/90 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-background/70">
                <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                  <MapPin className="size-3.5 text-[#ea4335]" />
                  Step 1 · Paste Maps link
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/70 bg-muted/50 px-3 py-2 dark:border-white/10">
                  <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-mono text-[10px] text-foreground">
                    maps.app.goo.gl/glow-grace-salon
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-md bg-foreground px-3 py-1.5 text-[10px] font-medium text-background">
                    Import business
                  </span>
                  <Sparkles className="size-3.5 text-amber-500" />
                </div>
                <p className="mt-3 text-[10px] text-muted-foreground">
                  Reviews · photos · hours · rating
                </p>
              </div>
            </motion.div>

            {/* Step 2 — Review */}
            <motion.div
              key="review-panel"
              animate={{
                z: zFor("review"),
                opacity: active === "review" ? 1 : 0.78,
                scale: active === "review" ? 1 : 0.95,
              }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
              style={{
                transformStyle: "preserve-3d",
                left: STEPS[1].x,
                top: STEPS[1].y,
                width: STEPS[1].w,
              }}
              className="absolute"
            >
              <div className="rounded-xl border border-border/70 bg-background/92 p-4 shadow-2xl backdrop-blur dark:border-white/12 dark:bg-background/75">
                <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                  <ClipboardList className="size-3.5" />
                  Step 2 · Review before publish
                </div>
                <ul className="mt-3 space-y-2">
                  {["Business name & tagline", "Services & photos", "Contact & hours"].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-2 text-[11px]">
                        <span className="flex size-4 items-center justify-center rounded-full bg-emerald-500/15">
                          <Check className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                        </span>
                        <span className="text-foreground">{item}</span>
                      </li>
                    )
                  )}
                </ul>
                <p className="mt-3 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1.5 text-[10px] text-amber-900 dark:text-amber-100/90">
                  Nothing goes live until you publish
                </p>
              </div>
            </motion.div>

            {/* Step 3 — Live site */}
            <motion.div
              key="publish-panel"
              animate={{
                z: zFor("publish"),
                opacity: active === "publish" ? 1 : 0.8,
                scale: active === "publish" ? 1 : 0.96,
              }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
              style={{
                transformStyle: "preserve-3d",
                left: STEPS[2].x,
                top: STEPS[2].y,
                width: STEPS[2].w,
              }}
              className="absolute"
            >
              <div className="overflow-hidden rounded-xl border border-foreground/15 bg-background shadow-2xl dark:border-white/18">
                <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2 dark:border-white/10">
                  <span className="size-1.5 rounded-full bg-[#34a853]" />
                  <span className="font-mono text-[10px] text-foreground">
                    glowgrace.paperchaiapp.com
                  </span>
                  <span className="ml-auto text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Live
                  </span>
                </div>
                <div className="h-14 bg-gradient-to-br from-rose-300 to-orange-300 dark:from-rose-500/50 dark:to-orange-400/40" />
                <div className="p-3">
                  <p className="text-[10px] font-semibold">Book an appointment</p>
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    {["10:00", "4:30", "6:00"].map((t) => (
                      <span
                        key={t}
                        className={
                          t === "4:30"
                            ? "rounded bg-foreground py-1 text-center text-[9px] font-medium text-background"
                            : "rounded border border-border/70 py-1 text-center text-[9px] text-muted-foreground"
                        }
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {!reduce ? (
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ z: 130 }}
              className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[10px] text-muted-foreground backdrop-blur dark:border-white/10"
            >
              Tap a step to explore the flow
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
