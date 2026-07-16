// Maps the chosen design (visual kit + density) to concrete Tailwind class
// fragments the generated renderer applies. Pure string maps — safe to import
// from client components (the kit picker previews reuse these exact tokens, so
// the demo a user sees matches the site they get). This is the guardrail: the
// AI / user only picks a kit name, and we decide exactly what that looks like.

import type { Density, SiteDesign, StyleTheme, VisualKit } from "@/lib/types";

export interface StyleClasses {
  /** Section <h2> heading classes (font weight / family / tracking). */
  heading: string;
  /** Eyebrow label classes (tracking / case), color applied separately. */
  eyebrow: string;
  /** Card surface (radius / border / shadow). */
  card: string;
  /** Button treatment for CTAs — radius plus any elevation/weight. */
  ctaRadius: string;
  /** Section vertical padding (density). */
  pad: string;
}

// The five UI-kits. Each is a complete, tested "look": a clean shadcn baseline,
// a Material-inspired elevated look, an editorial/magazine serif, a soft
// rounded kit and a bold heavy kit. The renderer never sees the kit name — only
// these class fragments — so no kit can render broken UI.
const KITS: Record<VisualKit, Omit<StyleClasses, "pad">> = {
  clean: {
    heading: "font-medium tracking-[-0.035em]",
    eyebrow: "uppercase tracking-[0.2em]",
    card: "rounded-xl border bg-card shadow-sm",
    ctaRadius: "rounded-md",
  },
  material: {
    // Material-inspired: medium-weight headings, borderless elevated surfaces
    // and lifted buttons that gain shadow on hover.
    heading: "font-medium tracking-[-0.025em]",
    eyebrow: "uppercase tracking-[0.12em] text-xs",
    card: "rounded-lg border-0 bg-card shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
    ctaRadius: "rounded-md shadow-md hover:shadow-lg transition-shadow",
  },
  editorial: {
    heading: "font-editorial font-medium tracking-[-0.025em]",
    eyebrow: "uppercase tracking-[0.25em]",
    card: "rounded-none border bg-card",
    ctaRadius: "rounded-none",
  },
  soft: {
    heading: "font-medium tracking-[-0.03em]",
    eyebrow: "tracking-wide",
    card: "rounded-3xl border bg-card shadow-md",
    ctaRadius: "rounded-full",
  },
  bold: {
    heading: "font-bold tracking-[-0.045em]",
    eyebrow: "font-semibold uppercase tracking-[0.15em]",
    card: "rounded-2xl border-2 bg-card shadow-lg",
    ctaRadius: "rounded-full font-semibold",
  },
};

// Older stored sites only have a styleTheme — map it onto the closest kit so
// they keep rendering exactly as before.
const STYLE_THEME_TO_KIT: Record<StyleTheme, VisualKit> = {
  minimal: "clean",
  editorial: "editorial",
  bold: "bold",
  warm: "soft",
};

export function styleThemeToKit(theme: StyleTheme): VisualKit {
  return STYLE_THEME_TO_KIT[theme] ?? "clean";
}

const DENSITY_PAD: Record<Density, string> = {
  compact: "py-12 sm:py-16",
  comfortable: "py-14 sm:py-20",
  airy: "py-16 sm:py-24 lg:py-28",
};

export function resolveKit(design: Pick<SiteDesign, "styleTheme" | "visualKit">): VisualKit {
  return design.visualKit ?? styleThemeToKit(design.styleTheme);
}

export function siteStyle(design: SiteDesign): StyleClasses {
  const kit = KITS[resolveKit(design)] ?? KITS.clean;
  return {
    ...kit,
    pad: DENSITY_PAD[design.density] ?? DENSITY_PAD.comfortable,
  };
}
