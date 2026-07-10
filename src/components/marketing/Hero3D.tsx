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
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const rise = {
  hidden: { opacity: 0, y: 48, rotateX: 16 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.95, ease: EASE },
  },
};

const SLOTS = ["10:00", "11:30", "4:30", "6:00"];

/**
 * Domain hero: a Google Business profile card feeding a live booking-ready
 * website, staged in real 3D depth. Pointer moves tilt the whole scene;
 * layers sit at different translateZ so parallax reads as depth.
 */
export function Hero3D() {
  const reduce = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 65, damping: 16, mass: 0.6 });
  const smy = useSpring(my, { stiffness: 65, damping: 16, mass: 0.6 });
  const rotateY = useTransform(smx, [-0.5, 0.5], [-11, 11]);
  const rotateX = useTransform(smy, [-0.5, 0.5], [9, -9]);

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
      className="relative mx-auto w-full max-w-[34rem] select-none"
      style={{ perspective: 1500 }}
      aria-hidden
    >
      {/* soft ground glow */}
      <div className="absolute inset-x-8 bottom-0 h-24 rounded-[100%] bg-foreground/10 blur-3xl dark:bg-white/10" />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        initial={reduce ? "show" : "hidden"}
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14 } } }}
        className="relative h-[420px] sm:h-[470px]"
      >
        {/* slow ambient sway on top of pointer tilt */}
        <motion.div
          animate={reduce ? undefined : { rotateY: [0, 1.6, -1.6, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
          className="absolute inset-0"
        >
          {/* ── Google Business profile card (back layer) ─────────────── */}
          <motion.div
            variants={rise}
            style={{ z: -60, rotateY: 10, transformStyle: "preserve-3d" }}
            className="absolute left-0 top-[7%] w-[54%]"
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -7, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-xl border border-border/70 bg-background/90 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-background/70 dark:shadow-black/40"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[#ea4335]/10">
                  <MapPin className="size-4 text-[#ea4335]" strokeWidth={2} />
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Google Business profile
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">
                Glow &amp; Grace Salon
              </p>
              <div className="mt-1.5 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-3 fill-amber-400 text-amber-400"
                  />
                ))}
                <span className="ml-1 text-[11px] text-muted-foreground">
                  4.9 · 182 reviews
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <div className="h-10 rounded-md bg-gradient-to-br from-rose-200 to-rose-300 dark:from-rose-500/40 dark:to-rose-400/25" />
                <div className="h-10 rounded-md bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-500/40 dark:to-orange-400/25" />
                <div className="h-10 rounded-md bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-500/40 dark:to-stone-400/25" />
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="size-3" />
                Open · Closes 8 pm
              </div>
            </motion.div>
          </motion.div>

          {/* ── data particles flowing profile → site ─────────────────── */}
          {!reduce
            ? [0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  style={{ z: 10 }}
                  className="absolute left-[38%] top-[44%] size-1.5 rounded-full bg-foreground/70 dark:bg-white/80"
                  animate={{ x: [0, 105], y: [0, 14], opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.6] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    delay: i * 0.75,
                    ease: "easeInOut",
                  }}
                />
              ))
            : null}

          {/* ── generated booking site (front layer) ──────────────────── */}
          <motion.div
            variants={rise}
            style={{ z: 70, rotateY: -7, transformStyle: "preserve-3d" }}
            className="absolute right-0 top-[16%] w-[62%]"
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-2xl shadow-black/15 dark:border-white/12 dark:shadow-black/50"
            >
              {/* browser chrome */}
              <div className="flex items-center gap-2 border-b border-border/70 bg-background/80 px-3 py-2 dark:border-white/10">
                <span className="size-1.5 rounded-full bg-[#ea4335]" />
                <span className="size-1.5 rounded-full bg-[#fbbc05]" />
                <span className="size-1.5 rounded-full bg-[#34a853]" />
                <span className="ml-1 flex-1 truncate rounded-md bg-muted/70 px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
                  glowgrace.paperchaiapp.com
                </span>
              </div>

              {/* mini site */}
              <div className="relative h-20 bg-gradient-to-br from-rose-300 via-rose-400 to-orange-300 dark:from-rose-500/70 dark:via-rose-500/50 dark:to-orange-400/50">
                <div className="absolute inset-x-3 bottom-2">
                  <p className="text-xs font-semibold text-white drop-shadow-sm">
                    Glow &amp; Grace Salon
                  </p>
                  <p className="text-[9px] text-white/85">
                    Bridal styling · Skin &amp; hair · Since 2016
                  </p>
                </div>
              </div>

              <div className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Book an appointment
                </p>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {SLOTS.map((t) => {
                    const active = t === "4:30";
                    return (
                      <span
                        key={t}
                        className={
                          active
                            ? "relative rounded-md bg-foreground px-1 py-1.5 text-center text-[10px] font-semibold text-background"
                            : "rounded-md border border-border/80 px-1 py-1.5 text-center text-[10px] text-muted-foreground dark:border-white/12"
                        }
                      >
                        {t}
                        {active && !reduce ? (
                          <motion.span
                            className="absolute inset-0 rounded-md border-2 border-foreground/60"
                            animate={{ opacity: [0.7, 0], scale: [1, 1.35] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                          />
                        ) : null}
                      </span>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-1.5">
                  <span className="flex flex-1 items-center justify-center gap-1 rounded-md bg-[#25d366]/15 py-1.5 text-[10px] font-medium text-[#128c4b] dark:text-[#4ade80]">
                    <MessageCircle className="size-3" />
                    WhatsApp
                  </span>
                  <span className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border/80 py-1.5 text-[10px] font-medium text-foreground dark:border-white/12">
                    <Phone className="size-3" />
                    Call
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ── floating proof chips (deepest front layers) ───────────── */}
          <motion.div
            variants={rise}
            style={{ z: 110 }}
            className="absolute right-[4%] top-0"
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -9, 0] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="flex items-center gap-2 rounded-full border border-border/70 bg-background/95 py-1.5 pl-2 pr-3.5 shadow-xl shadow-black/10 backdrop-blur dark:border-white/12 dark:bg-background/85 dark:shadow-black/40"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/15">
                <CalendarCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              </span>
              <span className="text-[11px] font-medium leading-none text-foreground">
                Booking confirmed
                <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                  Today · 4:30 PM
                </span>
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            variants={rise}
            style={{ z: 90 }}
            className="absolute bottom-[6%] left-[2%]"
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, 8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="flex items-center gap-2 rounded-full border border-border/70 bg-background/95 px-3.5 py-2 shadow-xl shadow-black/10 backdrop-blur dark:border-white/12 dark:bg-background/85 dark:shadow-black/40"
            >
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-medium text-foreground">
                4.9 rating imported
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            variants={rise}
            style={{ z: 100 }}
            className="absolute bottom-[16%] right-[1%]"
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -7, 0] }}
              transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 1.7 }}
              className="flex items-center gap-2 rounded-full border border-border/70 bg-background/95 px-3.5 py-2 shadow-xl shadow-black/10 backdrop-blur dark:border-white/12 dark:bg-background/85 dark:shadow-black/40"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#25d366] opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-[#25d366]" />
              </span>
              <span className="text-[11px] font-medium text-foreground">
                New WhatsApp enquiry
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
