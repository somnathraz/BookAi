"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.45, 0, 0.55, 1] as const;

/** Softer aurora + grid for inner marketing pages (pricing, about, dashboard). */
export function MarketingBackdrop({ intensity = "soft" }: { intensity?: "soft" | "full" }) {
  const reduce = useReducedMotion();
  const strong = intensity === "full";

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-background">
      <motion.div
        className={
          strong
            ? "absolute -inset-[35%] opacity-50 blur-[86px] dark:opacity-80"
            : "absolute -inset-[30%] opacity-35 blur-[72px] dark:opacity-55"
        }
        style={{
          background:
            "conic-gradient(from 120deg at 50% 50%, rgba(66,133,244,0.28), rgba(52,168,83,0.18), rgba(251,188,5,0.14), rgba(234,67,53,0.2), rgba(66,133,244,0.28))",
        }}
        animate={
          reduce
            ? undefined
            : {
                rotate: [0, 6, -8, 0],
                scale: [1, 1.05, 0.99, 1],
                x: ["-2%", "1.5%", "-1%", "-2%"],
              }
        }
        transition={{ duration: 28, ease: EASE, repeat: Infinity, repeatType: "loop" }}
      />
      <motion.div
        className="absolute inset-x-[-10%] top-[12%] h-[28rem] opacity-35 blur-[64px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(66,133,244,0.14), rgba(52,168,83,0.12), rgba(251,188,5,0.1), transparent)",
        }}
        animate={reduce ? undefined : { x: ["-6%", "5%", "-3%", "-6%"], y: [0, -18, 12, 0] }}
        transition={{ duration: 22, ease: EASE, repeat: Infinity, repeatType: "loop" }}
      />
      <div className="absolute inset-0 bg-grid-black opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent_88%)] dark:bg-grid-white dark:opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,transparent_0%,rgba(255,255,255,0.5)_50%,rgba(255,255,255,0.95)_100%)] dark:hidden" />
      <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_50%_20%,transparent_0%,rgba(10,10,10,0.15)_50%,rgba(10,10,10,0.82)_100%)] dark:block" />
    </div>
  );
}
