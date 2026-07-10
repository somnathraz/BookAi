"use client";

import { type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade-up entrance when scrolled into view. Safe to use from server pages. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Pointer-tracking 3D tilt with a moving sheen highlight. Children keep their
 * own layout; the wrapper only adds perspective and rotation.
 */
export function Tilt3D({
  children,
  className,
  maxTilt = 8,
  lift = false,
}: {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees. */
  maxTilt?: number;
  /** Also translate up slightly while hovered. */
  lift?: boolean;
}) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 120, damping: 15, mass: 0.4 });
  const smy = useSpring(my, { stiffness: 120, damping: 15, mass: 0.4 });
  const rotateY = useTransform(smx, [-0.5, 0.5], [-maxTilt, maxTilt]);
  const rotateX = useTransform(smy, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const sheenX = useTransform(smx, [-0.5, 0.5], ["20%", "80%"]);
  const sheenY = useTransform(smy, [-0.5, 0.5], ["20%", "80%"]);

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
    <div style={{ perspective: 1000 }} className={className}>
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        whileHover={reduce || !lift ? undefined : { y: -6 }}
        transition={{ duration: 0.35, ease: EASE }}
        className={cn("group/tilt relative h-full", !reduce && "will-change-transform")}
      >
        {children}
        {!reduce ? (
          <motion.div
            aria-hidden
            style={{
              // @ts-expect-error framer motion custom CSS vars
              "--sx": sheenX,
              "--sy": sheenY,
            }}
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100 [background:radial-gradient(320px_circle_at_var(--sx)_var(--sy),rgba(255,255,255,0.5),transparent_65%)] dark:[background:radial-gradient(320px_circle_at_var(--sx)_var(--sy),rgba(255,255,255,0.08),transparent_65%)]"
          />
        ) : null}
      </motion.div>
    </div>
  );
}
