"use client";

import { motion } from "framer-motion";

const EASE = [0.45, 0, 0.55, 1] as const;

interface Blob {
  className: string;
  gradient: string;
  x: number[];
  y: number[];
  scale: number[];
  duration: number;
}

const BLOBS: Blob[] = [
  {
    className: "left-[-10%] top-[-15%] h-[42rem] w-[42rem]",
    gradient:
      "radial-gradient(circle at center, rgba(139,92,246,0.55), transparent 65%)",
    x: [0, 60, -30, 0],
    y: [0, 40, 80, 0],
    scale: [1, 1.15, 0.95, 1],
    duration: 18,
  },
  {
    className: "right-[-15%] top-[-5%] h-[40rem] w-[40rem]",
    gradient:
      "radial-gradient(circle at center, rgba(56,189,248,0.5), transparent 65%)",
    x: [0, -50, 40, 0],
    y: [0, 60, 20, 0],
    scale: [1, 0.9, 1.2, 1],
    duration: 22,
  },
  {
    className: "left-[20%] top-[25%] h-[38rem] w-[38rem]",
    gradient:
      "radial-gradient(circle at center, rgba(16,185,129,0.4), transparent 65%)",
    x: [0, 70, -40, 0],
    y: [0, -50, 30, 0],
    scale: [1, 1.1, 0.95, 1],
    duration: 26,
  },
  {
    className: "right-[10%] top-[35%] h-[34rem] w-[34rem]",
    gradient:
      "radial-gradient(circle at center, rgba(236,72,153,0.38), transparent 65%)",
    x: [0, -40, 50, 0],
    y: [0, 40, -30, 0],
    scale: [1, 1.2, 1, 1],
    duration: 20,
  },
];

export function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-70 blur-[90px]">
        {BLOBS.map((blob, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${blob.className}`}
            style={{ background: blob.gradient }}
            animate={{ x: blob.x, y: blob.y, scale: blob.scale }}
            transition={{
              duration: blob.duration,
              ease: EASE,
              repeat: Infinity,
              repeatType: "loop",
            }}
          />
        ))}
      </div>

      {/* subtle grid */}
      <div className="absolute inset-0 bg-grid-white opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      {/* vignette so headline stays crisp and edges fade to background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(10,10,10,0.55)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
