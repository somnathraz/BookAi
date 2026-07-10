"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  CalendarCheck,
  Globe,
  Link2,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const rise = {
  hidden: { opacity: 0, y: 40, rotateX: 12 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.9, ease: EASE },
  },
};

/**
 * Interactive 3D pricing story: Free subdomain site vs Basic with custom
 * domain, booking, and no branding — pointer-tilted depth stack.
 */
export function PricingHero3D() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 65, damping: 16, mass: 0.6 });
  const smy = useSpring(my, { stiffness: 65, damping: 16, mass: 0.6 });
  const rotateY = useTransform(smx, [-0.5, 0.5], [-10, 10]);
  const rotateX = useTransform(smy, [-0.5, 0.5], [8, -8]);

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
      className="relative mx-auto w-full max-w-[32rem] select-none"
      style={{ perspective: 1400 }}
      aria-hidden
    >
      <div className="absolute inset-x-6 bottom-2 h-20 rounded-[100%] bg-foreground/8 blur-3xl dark:bg-white/8" />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        initial={reduce ? "show" : "hidden"}
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
        className="relative h-[380px] sm:h-[420px]"
      >
        <motion.div
          animate={reduce ? undefined : { rotateY: [0, 1.2, -1.2, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
          className="absolute inset-0"
        >
          {/* Free tier — back */}
          <motion.div
            variants={rise}
            style={{ z: -50, rotateY: 12, transformStyle: "preserve-3d" }}
            className="absolute left-0 top-[10%] w-[52%]"
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-xl border border-dashed border-border/80 bg-background/85 p-4 shadow-xl backdrop-blur dark:border-white/15 dark:bg-background/60"
            >
              <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                <Zap className="size-3.5" />
                Free plan
              </div>
              <p className="mt-2 font-mono text-xs text-foreground">salon.paperchaiapp.com</p>
              <div className="mt-3 h-14 rounded-lg bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-600/40 dark:to-stone-500/30" />
              <p className="mt-2 text-[10px] text-muted-foreground">1 site · contact links</p>
              <span className="mt-2 inline-flex rounded-md bg-muted px-2 py-0.5 text-[9px] text-muted-foreground">
                Built with PaperChai
              </span>
            </motion.div>
          </motion.div>

          {/* Upgrade arrow particles */}
          {!reduce
            ? [0, 1].map((i) => (
                <motion.span
                  key={i}
                  style={{ z: 5 }}
                  className="absolute left-[42%] top-[48%] size-1.5 rounded-full bg-foreground/60 dark:bg-white/70"
                  animate={{ x: [0, 72], opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.9, ease: "easeInOut" }}
                />
              ))
            : null}

          {/* Basic tier — front */}
          <motion.div
            variants={rise}
            style={{ z: 80, rotateY: -8, transformStyle: "preserve-3d" }}
            className="absolute right-0 top-[18%] w-[64%]"
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -9, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="overflow-hidden rounded-xl border border-foreground/20 bg-background shadow-2xl shadow-black/15 dark:border-white/20 dark:shadow-black/45"
            >
              <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2 dark:border-white/10">
                <Globe className="size-3.5 text-foreground" />
                <span className="font-mono text-[10px] text-foreground">www.glowgrace.in</span>
                <span className="ml-auto rounded-full bg-foreground px-2 py-0.5 text-[9px] font-semibold text-background">
                  Basic
                </span>
              </div>
              <div className="h-16 bg-gradient-to-br from-rose-300 via-rose-400 to-orange-300 dark:from-rose-500/60 dark:to-orange-400/50" />
              <div className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Book a slot
                </p>
                <div className="mt-2 flex gap-1.5">
                  {["10:00", "4:30"].map((t) => (
                    <span
                      key={t}
                      className={
                        t === "4:30"
                          ? "rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background"
                          : "rounded-md border border-border/70 px-2 py-1 text-[10px] text-muted-foreground"
                      }
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex gap-1.5">
                  <span className="flex flex-1 items-center justify-center gap-1 rounded-md bg-[#25d366]/15 py-1 text-[9px] font-medium text-[#128c4b]">
                    <MessageCircle className="size-3" />
                    WhatsApp
                  </span>
                  <span className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border/70 py-1 text-[9px]">
                    <CalendarCheck className="size-3" />
                    Slots
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* floating value chips */}
          <motion.div variants={rise} style={{ z: 120 }} className="absolute -right-1 top-2">
            <motion.div
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-2 rounded-full border border-border/70 bg-background/95 px-3 py-2 shadow-xl backdrop-blur dark:border-white/12"
            >
              <Sparkles className="size-3.5 text-amber-500" />
              <span className="text-[11px] font-medium">5 sites included</span>
            </motion.div>
          </motion.div>

          <motion.div variants={rise} style={{ z: 100 }} className="absolute bottom-[8%] left-0">
            <motion.div
              animate={reduce ? undefined : { y: [0, 7, 0] }}
              transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="flex items-center gap-2 rounded-full border border-border/70 bg-background/95 px-3 py-2 shadow-xl backdrop-blur dark:border-white/12"
            >
              <Link2 className="size-3.5" />
              <span className="text-[11px] font-medium">Your own domain</span>
            </motion.div>
          </motion.div>

          <motion.div variants={rise} style={{ z: 110 }} className="absolute bottom-[22%] right-[-2%]">
            <motion.div
              animate={reduce ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
              className="flex items-center gap-2 rounded-full border border-border/70 bg-background/95 px-3 py-2 shadow-xl backdrop-blur dark:border-white/12"
            >
              <span className="text-[11px] font-medium text-foreground">No PaperChai badge</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
