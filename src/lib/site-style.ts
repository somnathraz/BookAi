// Maps the AI-chosen design (style theme + density) to concrete Tailwind class
// fragments the generated renderer applies. Pure string maps — safe to import
// from client components. This is the guardrail: the AI only picks a theme
// name, and we decide exactly what that looks like.

import type { Density, SiteDesign, StyleTheme } from "@/lib/types";

export interface StyleClasses {
  /** Section <h2> heading classes (font weight / family / tracking). */
  heading: string;
  /** Eyebrow label classes (tracking / case), color applied separately. */
  eyebrow: string;
  /** Card surface (radius / border / shadow). */
  card: string;
  /** Corner style for primary CTA buttons. */
  ctaRadius: string;
  /** Section vertical padding (density). */
  pad: string;
}

const THEMES: Record<StyleTheme, Omit<StyleClasses, "pad">> = {
  minimal: {
    heading: "font-semibold tracking-tight",
    eyebrow: "uppercase tracking-[0.2em]",
    card: "rounded-xl border bg-card shadow-sm",
    ctaRadius: "rounded-md",
  },
  editorial: {
    heading: "font-serif font-medium tracking-tight",
    eyebrow: "uppercase tracking-[0.25em]",
    card: "rounded-none border bg-card",
    ctaRadius: "rounded-none",
  },
  bold: {
    heading: "font-bold tracking-tight",
    eyebrow: "font-semibold uppercase tracking-[0.15em]",
    card: "rounded-2xl border-2 bg-card shadow-lg",
    ctaRadius: "rounded-full",
  },
  warm: {
    heading: "font-semibold tracking-tight",
    eyebrow: "tracking-wide",
    card: "rounded-3xl border bg-card shadow-md",
    ctaRadius: "rounded-full",
  },
};

const DENSITY_PAD: Record<Density, string> = {
  compact: "py-12",
  comfortable: "py-20",
  airy: "py-28",
};

export function siteStyle(design: SiteDesign): StyleClasses {
  const theme = THEMES[design.styleTheme] ?? THEMES.minimal;
  return {
    ...theme,
    pad: DENSITY_PAD[design.density] ?? DENSITY_PAD.comfortable,
  };
}
