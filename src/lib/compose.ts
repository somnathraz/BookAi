// Archetype + section composition. This is the "decide the shape of the site"
// layer. It derives a non-overlapping archetype (a resume → person profile, a
// Google Business → business site, a designer/photographer → portfolio) and a
// sensible default ordering of sections. The AI may override the ordering, but
// this template fallback guarantees a coherent site even with no AI.

import type {
  Archetype,
  BusinessDomain,
  CareerStage,
  Density,
  GalleryVariant,
  SectionType,
  ServicesVariant,
  SiteData,
  SiteDesign,
  SiteSection,
  SourceId,
  StyleTheme,
  TestimonialsVariant,
  VisualKit,
  WorkVariant,
} from "@/lib/types";

/**
 * A conservative resume-stage suggestion. A candidate can always change this
 * during import; the heuristic only saves them an unnecessary decision.
 */
export function suggestCareerStage(input: {
  work?: { title?: string; period?: string }[];
  projects?: unknown[];
}): CareerStage {
  const roles = input.work ?? [];
  const roleText = roles.map((role) => `${role.title ?? ""} ${role.period ?? ""}`).join(" ").toLowerCase();
  const seniorSignal = /\b(senior|lead|principal|manager|director|head|architect|staff|founder)\b/.test(roleText);
  const earlySignal = /\b(intern|internship|trainee|graduate|student|fresher|apprentice)\b/.test(roleText);

  if (seniorSignal || (!earlySignal && roles.length >= 2)) return "experienced";
  return "early-career";
}

// Domains that read as a walk-in / local business vs. a personal practice.
const BUSINESS_DOMAINS: BusinessDomain[] = ["restaurant", "doctor", "fitness"];
const PORTFOLIO_DOMAINS: BusinessDomain[] = [
  "designer",
  "photographer",
  "developer",
];

// Source wins first (it's the strongest signal), then domain.
export function deriveArchetype(
  domain: BusinessDomain,
  source?: SourceId
): Archetype {
  if (source === "resume" || source === "linkedin") return "profile";
  if (source === "maps") return "business";

  if (BUSINESS_DOMAINS.includes(domain)) return "business";
  if (PORTFOLIO_DOMAINS.includes(domain)) return "portfolio";
  if (domain === "consultant") return "profile";

  // competitor / manual / "other" fall back to a portfolio-style page, which
  // is the most generic and works for both people and small businesses.
  return source === "competitor" ? "portfolio" : "profile";
}

// The default, non-overlapping ordering per archetype. Each archetype leads
// with the block that matters most to that audience — and deliberately keeps
// them distinct:
//  - profile  → a PERSON. Leads with the experience timeline; NO services block
//               (a CV is about roles & history, not offerings).
//  - portfolio→ a MAKER. Leads with the work/projects; services are secondary.
//  - business → a COMPANY/PRACTICE. Leads with services + photos + reviews;
//               never an experience timeline.
const ARCHETYPE_ORDER: Record<Archetype, SectionType[]> = {
  profile: [
    "about",
    "skills",
    "experience",
    "projects",
    "certifications",
    "languages",
    "interests",
    "stats",
    "testimonials",
    "faq",
    "cta",
  ],
  portfolio: [
    "casestudy",
    "projects",
    "skills",
    "about",
    "experience",
    "certifications",
    "testimonials",
    "faq",
    "cta",
  ],
  business: [
    "about",
    "services",
    "menu",
    "gallery",
    "hours",
    "testimonials",
    "faq",
    "booking",
    "cta",
  ],
};

const PROFILE_STAGE_ORDER: Record<CareerStage, SectionType[]> = {
  // Early-career candidates need visible proof of ability before a short work
  // history. Credentials also carry more weight at this stage.
  "early-career": [
    "about",
    "projects",
    "skills",
    "certifications",
    "experience",
    "languages",
    "interests",
    "testimonials",
    "cta",
  ],
  // Experienced candidates are hired for scope and progression, so their work
  // history comes immediately after the executive summary.
  experienced: [
    "about",
    "stats",
    "experience",
    "projects",
    "skills",
    "certifications",
    "languages",
    "interests",
    "testimonials",
    "faq",
    "cta",
  ],
};

// Hard segregation: which block types each archetype is even allowed to show.
// This is the guardrail that keeps a profile from sprouting a "services" block
// or a business from sprouting an "experience" timeline, no matter what the AI
// returns. about + cta are universal.
const ARCHETYPE_ALLOWED: Record<Archetype, SectionType[]> = {
  profile: [
    "about",
    "skills",
    "experience",
    "projects",
    "certifications",
    "languages",
    "interests",
    "stats",
    "testimonials",
    "faq",
    "cta",
  ],
  portfolio: [
    "about",
    "casestudy",
    "projects",
    "portfolio",
    "skills",
    "experience",
    "services",
    "certifications",
    "stats",
    "testimonials",
    "faq",
    "cta",
  ],
  business: ["about", "services", "menu", "gallery", "hours", "testimonials", "faq", "booking", "cta"],
};

interface ComposeInput {
  archetype: Archetype;
  hasWork: boolean;
  hasProjects: boolean;
  hasSkills: boolean;
  hasCerts: boolean;
  hasLanguages: boolean;
  hasInterests: boolean;
  hasServices: boolean;
  hasStats: boolean;
  hasTestimonials: boolean;
  hasGallery: boolean;
  hasHours: boolean;
  hasMenu: boolean;
  hasFaq: boolean;
  hasBooking: boolean;
}

// Decide whether a section has enough content to render. Keeps empty blocks
// (e.g. a gallery with no photos) out of the page so it never looks padded.
function sectionHasContent(type: SectionType, c: ComposeInput): boolean {
  switch (type) {
    case "about":
    case "cta":
      return true; // always present
    case "services":
      return c.hasServices;
    case "stats":
      return c.hasStats;
    case "experience":
    case "portfolio":
      return c.hasWork;
    case "casestudy":
      return c.hasWork || c.hasProjects;
    case "projects":
      return c.hasProjects;
    case "menu":
      return c.hasMenu;
    case "faq":
      return c.hasFaq;
    case "skills":
      return c.hasSkills;
    case "certifications":
      return c.hasCerts;
    case "languages":
      return c.hasLanguages;
    case "interests":
      return c.hasInterests;
    case "gallery":
      return c.hasGallery;
    case "hours":
      return c.hasHours;
    case "testimonials":
      return c.hasTestimonials;
    case "booking":
      return c.hasBooking;
    default:
      return false;
  }
}

// Build the ComposeInput from a SiteData snapshot (used by both defaults and
// AI validation).
function composeInput(site: SiteData): ComposeInput {
  return {
    archetype: site.archetype,
    hasWork: site.work.length > 0,
    hasProjects: (site.projects?.length ?? 0) > 0,
    hasSkills: (site.skills?.length ?? 0) > 0,
    hasCerts: (site.certifications?.length ?? 0) > 0,
    hasLanguages: (site.languages?.length ?? 0) > 0,
    hasInterests: (site.interests?.length ?? 0) > 0,
    hasServices: site.services.length > 0,
    hasStats: site.bio.stats.length > 0,
    hasTestimonials: site.testimonials.length > 0,
    hasGallery: site.gallery.length > 0,
    hasHours:
      (site.storeHours?.rows?.length ?? 0) > 0 || Boolean(site.mapEmbedUrl),
    hasMenu: (site.menu?.length ?? 0) > 0,
    hasFaq: (site.faq?.length ?? 0) > 0,
    hasBooking: Boolean(site.booking?.enabled),
  };
}

// Build the default ordered sections for a site, dropping empty blocks.
export function defaultSections(site: SiteData): SiteSection[] {
  const c = composeInput(site);
  const order =
    c.archetype === "profile" && site.careerStage
      ? PROFILE_STAGE_ORDER[site.careerStage]
      : ARCHETYPE_ORDER[c.archetype];
  return order
    .filter((type) => sectionHasContent(type, c))
    .map((type) => ({ type }));
}

// Validate / clean an AI-proposed ordering against what we can actually render.
// Unknown types are dropped, duplicates removed, empty blocks filtered, and a
// CTA is always appended so every site ends with a call to action.
export function sanitizeSections(
  raw: unknown,
  site: SiteData
): SiteSection[] {
  const allowed: SectionType[] = [
    "about",
    "stats",
    "skills",
    "services",
    "menu",
    "experience",
    "projects",
    "portfolio",
    "casestudy",
    "gallery",
    "hours",
    "certifications",
    "languages",
    "interests",
    "faq",
    "booking",
    "testimonials",
    "cta",
  ];
  const c = composeInput(site);

  const seen = new Set<SectionType>();
  const out: SiteSection[] = [];

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const type = (typeof item === "string" ? item : item?.type) as SectionType;
      if (!allowed.includes(type)) continue;
      if (!ARCHETYPE_ALLOWED[c.archetype].includes(type)) continue; // segregation
      if (seen.has(type)) continue;
      if (!sectionHasContent(type, c)) continue;
      const label = typeof item?.label === "string" ? item.label.slice(0, 40) : undefined;
      const heading =
        typeof item?.heading === "string" ? item.heading.slice(0, 80) : undefined;
      seen.add(type);
      out.push({ type, label, heading });
    }
  }

  // A portfolio/profile/business with nothing usable → fall back entirely.
  if (out.length < 2) return defaultSections(site);

  // Career stage is a layout decision, not merely a copy hint. Keep AI-written
  // labels and headings, but always honour the selected hierarchy so an
  // early-career page cannot drift back to an experience-first sequence.
  if (site.archetype === "profile" && site.careerStage) {
    const overrides = new Map(out.map((section) => [section.type, section]));
    return defaultSections(site).map((section) => ({
      ...section,
      ...overrides.get(section.type),
    }));
  }

  if (!seen.has("cta")) out.push({ type: "cta" });
  return out;
}

// ── Design (style theme + per-section variants) ───────────────────────────────

const STYLE_THEMES: StyleTheme[] = ["minimal", "editorial", "bold", "warm"];
export const VISUAL_KITS: VisualKit[] = ["clean", "material", "editorial", "soft", "bold"];
const DENSITIES: Density[] = ["compact", "comfortable", "airy"];

// Each kit carries a matching styleTheme so older code paths and the heading
// font stay consistent with the kit's look.
const KIT_TO_STYLE_THEME: Record<VisualKit, StyleTheme> = {
  clean: "minimal",
  material: "minimal",
  editorial: "editorial",
  soft: "warm",
  bold: "bold",
};
const SERVICES_VARIANTS: ServicesVariant[] = ["bento", "cards", "list"];
const WORK_VARIANTS: WorkVariant[] = ["grid", "masonry"];
const TESTIMONIALS_VARIANTS: TestimonialsVariant[] = ["cards", "marquee"];
const GALLERY_VARIANTS: GalleryVariant[] = ["masonry", "carousel"];

// A sensible, on-brand default design per archetype — the template fallback.
// `visualKit` is the authoritative look and stays in sync with `styleTheme`.
const ARCHETYPE_DESIGN: Record<Archetype, SiteDesign> = {
  profile: {
    styleTheme: "minimal",
    visualKit: "clean",
    density: "comfortable",
    variants: { services: "cards", work: "grid", testimonials: "cards", gallery: "masonry" },
  },
  business: {
    styleTheme: "warm",
    visualKit: "soft",
    density: "compact",
    variants: { services: "cards", work: "grid", testimonials: "marquee", gallery: "masonry" },
  },
  portfolio: {
    styleTheme: "editorial",
    visualKit: "editorial",
    density: "airy",
    variants: { services: "list", work: "masonry", testimonials: "cards", gallery: "masonry" },
  },
};

const PROFILE_STAGE_DESIGN: Record<CareerStage, SiteDesign> = {
  "early-career": {
    styleTheme: "editorial",
    visualKit: "editorial",
    density: "airy",
    variants: { services: "cards", work: "masonry", testimonials: "cards", gallery: "masonry" },
  },
  experienced: {
    styleTheme: "minimal",
    visualKit: "clean",
    density: "comfortable",
    variants: { services: "cards", work: "grid", testimonials: "cards", gallery: "masonry" },
  },
};

// When the user (or AI) picks a kit explicitly, apply it and keep styleTheme in
// step. Otherwise fall back to the archetype's default look.
function applyKit(base: SiteDesign, kit?: VisualKit): SiteDesign {
  if (!kit || !VISUAL_KITS.includes(kit)) return base;
  return { ...base, visualKit: kit, styleTheme: KIT_TO_STYLE_THEME[kit] };
}

export function defaultDesign(
  archetype: Archetype,
  visualKit?: VisualKit,
  careerStage?: CareerStage
): SiteDesign {
  const base =
    archetype === "profile" && careerStage
      ? PROFILE_STAGE_DESIGN[careerStage]
      : ARCHETYPE_DESIGN[archetype] ?? ARCHETYPE_DESIGN.profile;
  return applyKit(base, visualKit);
}

function pick<T>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

// Validate an AI-proposed design against the closed sets. The overall visual
// kit is deterministic: an explicit user choice wins, otherwise the archetype
// default shown in preview wins. AI can vary density and section layouts but
// cannot swap the visual personality after the user has previewed it.
export function sanitizeDesign(
  raw: unknown,
  archetype: Archetype,
  userKit?: VisualKit,
  careerStage?: CareerStage
): SiteDesign {
  const base = defaultDesign(archetype, undefined, careerStage);
  const r = (raw ?? {}) as {
    styleTheme?: unknown;
    visualKit?: unknown;
    density?: unknown;
    variants?: {
      services?: unknown;
      work?: unknown;
      testimonials?: unknown;
      gallery?: unknown;
    };
  };
  const v = r.variants ?? {};

  const kit = userKit ?? base.visualKit;

  const design: SiteDesign = {
    styleTheme: pick(r.styleTheme, STYLE_THEMES, base.styleTheme),
    density: pick(r.density, DENSITIES, base.density),
    variants: {
      services: pick(v.services, SERVICES_VARIANTS, base.variants.services!),
      work: pick(v.work, WORK_VARIANTS, base.variants.work!),
      testimonials: pick(v.testimonials, TESTIMONIALS_VARIANTS, base.variants.testimonials!),
      gallery: pick(v.gallery, GALLERY_VARIANTS, base.variants.gallery!),
    },
  };

  // Applying the kit keeps styleTheme consistent with the chosen look.
  return applyKit(design, kit);
}
