"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.45, 0, 0.55, 1] as const;

export function AuroraBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-background">
      <motion.div
        className="absolute -inset-[35%] opacity-50 blur-[86px] dark:opacity-80"
        style={{
          background:
            "conic-gradient(from 120deg at 50% 50%, rgba(66,133,244,0.34), rgba(52,168,83,0.22), rgba(251,188,5,0.18), rgba(234,67,53,0.24), rgba(66,133,244,0.34))",
        }}
        animate={
          reduceMotion
            ? undefined
            : {
                rotate: [0, 8, -10, 0],
                scale: [1, 1.08, 0.98, 1],
                x: ["-3%", "2%", "-1%", "-3%"],
                y: ["-2%", "2%", "0%", "-2%"],
              }
        }
        transition={{
          duration: 26,
          ease: EASE,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />
      <motion.div
        className="absolute inset-x-[-15%] top-[18%] h-[32rem] opacity-45 blur-[72px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(66,133,244,0.18), rgba(52,168,83,0.16), rgba(251,188,5,0.14), rgba(234,67,53,0.16), transparent)",
        }}
        animate={reduceMotion ? undefined : { x: ["-8%", "6%", "-4%", "-8%"], y: [0, -24, 18, 0] }}
        transition={{
          duration: 20,
          ease: EASE,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />

      <div className="absolute inset-0 bg-grid-black opacity-45 [mask-image:linear-gradient(to_bottom,black,transparent_82%)] dark:bg-grid-white dark:opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_28%,transparent_0%,rgba(255,255,255,0.45)_48%,rgba(255,255,255,0.92)_100%)] dark:hidden" />
      <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_50%_28%,transparent_0%,rgba(10,10,10,0.18)_48%,rgba(10,10,10,0.78)_100%)] dark:block" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-background via-background/80 to-transparent" />
    </div>
  );
}
