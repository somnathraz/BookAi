"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, MapPin, Plus } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Compact interactive 3D scene for the empty dashboard — first site awaits. */
export function DashboardEmpty3D() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 80, damping: 18, mass: 0.5 });
  const smy = useSpring(my, { stiffness: 80, damping: 18, mass: 0.5 });
  const rotateY = useTransform(smx, [-0.5, 0.5], [-8, 8]);
  const rotateX = useTransform(smy, [-0.5, 0.5], [6, -6]);

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

  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative mx-auto w-full max-w-sm select-none"
      style={{ perspective: 1200 }}
      aria-hidden
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative h-[220px]"
      >
        {/* empty slot */}
        <motion.div
          style={{ z: -30, rotateY: 8 }}
          animate={reduce ? undefined : { y: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[8%] top-[18%] w-[44%] rounded-xl border border-dashed border-border/80 bg-background/60 p-4 dark:border-white/15 dark:bg-background/40"
        >
          <div className="flex size-10 items-center justify-center rounded-lg border border-dashed border-border/70 dark:border-white/12">
            <Plus className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-xs font-medium text-muted-foreground">Your first site</p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">yoursite.paperchaiapp.com</p>
        </motion.div>

        {/* maps input cue */}
        <motion.div
          style={{ z: 50, rotateY: -6 }}
          animate={reduce ? undefined : { y: [0, -7, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="absolute right-0 top-[8%] w-[58%] rounded-xl border border-border/70 bg-background p-4 shadow-xl dark:border-white/12"
        >
          <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
            <MapPin className="size-3.5 text-[#ea4335]" />
            Start with Google Maps
          </div>
          <div className="mt-2 h-8 rounded-md bg-muted/60" />
          <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-foreground">
            Paste link
            <ArrowRight className="size-3" />
          </div>
        </motion.div>

        {/* glow */}
        <div className="absolute inset-x-4 bottom-0 h-12 rounded-[100%] bg-foreground/6 blur-2xl dark:bg-white/6" />
      </motion.div>
    </div>
  );
}
