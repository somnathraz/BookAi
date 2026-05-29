// Archetype + section composition. This is the "decide the shape of the site"
// layer. It derives a non-overlapping archetype (a resume → person profile, a
// Google Business → business site, a designer/photographer → portfolio) and a
// sensible default ordering of sections. The AI may override the ordering, but
// this template fallback guarantees a coherent site even with no AI.

import type {
  Archetype,
  BusinessDomain,
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
  WorkVariant,
} from "@/lib/types";

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
    "cta",
  ],
  portfolio: [
    "projects",
    "skills",
    "about",
    "experience",
    "certifications",
    "testimonials",
    "cta",
  ],
  business: ["about", "services", "gallery", "testimonials", "cta"],
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
    "cta",
  ],
  portfolio: [
    "about",
    "projects",
    "portfolio",
    "skills",
    "experience",
    "services",
    "certifications",
    "stats",
    "testimonials",
    "cta",
  ],
  business: ["about", "services", "gallery", "testimonials", "cta"],
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
    case "projects":
      return c.hasProjects;
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
    case "testimonials":
      return c.hasTestimonials;
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
  };
}

// Build the default ordered sections for a site, dropping empty blocks.
export function defaultSections(site: SiteData): SiteSection[] {
  const c = composeInput(site);
  return ARCHETYPE_ORDER[c.archetype]
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
    "experience",
    "projects",
    "portfolio",
    "gallery",
    "certifications",
    "languages",
    "interests",
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

  if (!seen.has("cta")) out.push({ type: "cta" });
  return out;
}

// ── Design (style theme + per-section variants) ───────────────────────────────

const STYLE_THEMES: StyleTheme[] = ["minimal", "editorial", "bold", "warm"];
const DENSITIES: Density[] = ["compact", "comfortable", "airy"];
const SERVICES_VARIANTS: ServicesVariant[] = ["bento", "cards", "list"];
const WORK_VARIANTS: WorkVariant[] = ["grid", "masonry"];
const TESTIMONIALS_VARIANTS: TestimonialsVariant[] = ["cards", "marquee"];
const GALLERY_VARIANTS: GalleryVariant[] = ["masonry", "carousel"];

// A sensible, on-brand default design per archetype — the template fallback.
const ARCHETYPE_DESIGN: Record<Archetype, SiteDesign> = {
  profile: {
    styleTheme: "minimal",
    density: "comfortable",
    variants: { services: "cards", work: "grid", testimonials: "cards", gallery: "masonry" },
  },
  business: {
    styleTheme: "warm",
    density: "compact",
    variants: { services: "cards", work: "grid", testimonials: "marquee", gallery: "masonry" },
  },
  portfolio: {
    styleTheme: "editorial",
    density: "airy",
    variants: { services: "list", work: "masonry", testimonials: "cards", gallery: "masonry" },
  },
};

export function defaultDesign(archetype: Archetype): SiteDesign {
  return ARCHETYPE_DESIGN[archetype] ?? ARCHETYPE_DESIGN.profile;
}

function pick<T>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

// Validate an AI-proposed design against the closed sets, falling back to the
// archetype default for anything missing or invalid.
export function sanitizeDesign(raw: unknown, archetype: Archetype): SiteDesign {
  const base = defaultDesign(archetype);
  const r = (raw ?? {}) as {
    styleTheme?: unknown;
    density?: unknown;
    variants?: {
      services?: unknown;
      work?: unknown;
      testimonials?: unknown;
      gallery?: unknown;
    };
  };
  const v = r.variants ?? {};
  return {
    styleTheme: pick(r.styleTheme, STYLE_THEMES, base.styleTheme),
    density: pick(r.density, DENSITIES, base.density),
    variants: {
      services: pick(v.services, SERVICES_VARIANTS, base.variants.services!),
      work: pick(v.work, WORK_VARIANTS, base.variants.work!),
      testimonials: pick(v.testimonials, TESTIMONIALS_VARIANTS, base.variants.testimonials!),
      gallery: pick(v.gallery, GALLERY_VARIANTS, base.variants.gallery!),
    },
  };
}
