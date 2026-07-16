"use client";

import { Check, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { siteStyle, styleThemeToKit } from "@/lib/site-style";
import type { SiteDesign, StyleTheme, VisualKit } from "@/lib/types";

// User-facing copy for each kit. The class tokens themselves live in
// lib/site-style.ts so the demo below renders with the exact same styling the
// generated site will use.
const KIT_META: { id: VisualKit; label: string; blurb: string }[] = [
  { id: "clean", label: "Clean", blurb: "Modern, shadcn-style. Subtle borders." },
  { id: "material", label: "Material", blurb: "Elevated cards, lifted buttons." },
  { id: "editorial", label: "Editorial", blurb: "Serif headings, sharp edges." },
  { id: "soft", label: "Soft", blurb: "Friendly, rounded, gentle shadows." },
  { id: "bold", label: "Bold", blurb: "Heavy weights, big radius." },
];

const KIT_STYLE_THEME: Record<VisualKit, StyleTheme> = {
  clean: "minimal",
  material: "minimal",
  editorial: "editorial",
  soft: "warm",
  bold: "bold",
};

// Build the minimal design object a preview needs. Variants don't affect the
// demo, so we use any valid combination.
function demoDesign(kit: VisualKit): SiteDesign {
  return {
    visualKit: kit,
    styleTheme: KIT_STYLE_THEME[kit] ?? styleThemeToKit("minimal"),
    density: "comfortable",
    variants: { services: "cards", work: "grid", testimonials: "cards", gallery: "masonry" },
  };
}

// A tiny, content-identical mock so kits can be compared apples-to-apples —
// only the styling changes between previews.
function KitPreview({ kit, accent }: { kit: VisualKit; accent?: string }) {
  const st = siteStyle(demoDesign(kit));
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-[#f3f3ef] p-3 dark:bg-white/[0.04]">
      <span className={cn("text-[8px] text-muted-foreground", st.eyebrow)}>
        STUDIO
      </span>
      <span className={cn("text-sm leading-tight", st.heading)}>
        Your headline
      </span>
      <div className={cn("flex items-center gap-2 p-2", st.card)}>
        <span className="size-4 rounded-full bg-foreground/10" />
        <span className="text-[9px] text-muted-foreground">A service card</span>
      </div>
      <span
        className={cn(
          "mt-0.5 inline-flex w-fit items-center px-2.5 py-1 text-[9px] font-medium text-white",
          st.ctaRadius
        )}
        style={{ backgroundColor: accent ?? "var(--primary)" }}
      >
        Get in touch
      </span>
    </div>
  );
}

export function VisualKitPicker({
  value,
  onChange,
  accent,
}: {
  /** The selected kit, or undefined for "Auto" (let the AI decide). */
  value: VisualKit | undefined;
  onChange: (kit: VisualKit | undefined) => void;
  accent?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {/* Auto — use the stable best-fitting kit for the selected site type. */}
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className={cn(
          "flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors",
          value === undefined
            ? "border-[#214f43] bg-[#dce8e2] dark:border-[#9cc2b3] dark:bg-[#214f43]/20"
            : "border-[#11130f]/10 hover:border-[#214f43]/35 hover:bg-[#f3f3ef] dark:border-white/10 dark:hover:border-[#9cc2b3]/35 dark:hover:bg-white/[0.04]"
        )}
      >
        <div className="flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-lg bg-[#f3f3ef] p-3 text-center dark:bg-white/[0.04]">
          <Sparkles className="size-5 text-[#214f43] dark:text-[#9cc2b3]" />
          <span className="text-[10px] leading-snug text-muted-foreground">
            Best fit for this site type
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {value === undefined && <Check className="size-3.5" />}
          Auto
        </span>
        <span className="text-xs leading-snug text-muted-foreground">
          A stable, preview-safe default.
        </span>
      </button>

      {KIT_META.map((kit) => {
        const active = value === kit.id;
        return (
          <button
            key={kit.id}
            type="button"
            onClick={() => onChange(kit.id)}
            className={cn(
              "flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors",
              active
                ? "border-[#214f43] bg-[#dce8e2] dark:border-[#9cc2b3] dark:bg-[#214f43]/20"
                : "border-[#11130f]/10 hover:border-[#214f43]/35 hover:bg-[#f3f3ef] dark:border-white/10 dark:hover:border-[#9cc2b3]/35 dark:hover:bg-white/[0.04]"
            )}
          >
            <KitPreview kit={kit.id} accent={accent} />
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              {active && <Check className="size-3.5" />}
              {kit.label}
            </span>
            <span className="text-xs leading-snug text-muted-foreground">
              {kit.blurb}
            </span>
          </button>
        );
      })}
    </div>
  );
}
