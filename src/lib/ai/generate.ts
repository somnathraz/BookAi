import "server-only";

import { completeJSON } from "@/lib/ai/provider";
import { PRODUCT_NAME } from "@/lib/brand";
import { generateSite } from "@/lib/template";
import { mergeCertifications } from "@/lib/certifications";
import { sanitizeSections, sanitizeDesign } from "@/lib/compose";
import type {
  Archetype,
  FaqItem,
  GeneratorInput,
  MenuItem,
  ServiceItem,
  SiteData,
  Stat,
  Testimonial,
  WorkItem,
} from "@/lib/types";

// Icon names the renderer can resolve (mirrors components/generated/icons.tsx).
const ALLOWED_ICONS = new Set([
  "Activity", "Aperture", "Briefcase", "Camera", "ChefHat", "CheckCircle2",
  "Code2", "Coffee", "Database", "Dumbbell", "Flame", "Gauge", "Heart",
  "HeartPulse", "Image", "Layout", "Lightbulb", "Palette", "PenTool", "Rocket",
  "ShieldPlus", "Sparkles", "Star", "Stethoscope", "Target", "TrendingUp",
  "Trophy", "UtensilsCrossed", "Wine",
]);

// PaperChai's default brand/voice prompt — the "system prompt" that turns a profile
const SYSTEM_PROMPT = `You are ${PRODUCT_NAME}'s senior brand copywriter and one-page web designer. You turn a business profile into the content for a polished, conversion-focused single-page website.

Voice & rules:
- Clean, confident, benefit-driven. Warm and human. No corporate filler, no buzzwords, no exclamation-mark hype.
- Tailor every word to the business's domain and audience. Many are Indian SMBs and solo professionals — keep it grounded and trustworthy.
- NEVER invent specific facts, client names, awards, or metrics that aren't supported by the input. If a number isn't given, use qualitative phrasing instead of a fake figure.
- Only include testimonials that are present in the input. If none are provided, return an empty testimonials array.
- The section LABELS must fit the domain (e.g. a doctor's work section is "Specialities", a developer's is "Selected work").
- The CTA must fit the SITE TYPE: for a profile/portfolio it is about hiring, collaboration, or getting in touch (e.g. "Let's work together", "Get in touch", "Start a project") — NEVER "Book a table"/"Order". For a business it is about booking/visiting/contacting.
- Respect the requested theme as a tonal cue (dark = sleek/modern, light = clean/friendly) but DO NOT change the theme value.
- Keep copy tight: tagline <= 12 words, hero intro <= 30 words, each service/work description <= 18 words, CTA subtext <= 20 words.
- About / bio body length depends on site type: for a personal PROFILE, write a rich "about" section — 2-3 paragraphs, 100-150 words total, covering background, strengths, and what they're looking for; for business/portfolio keep bio body <= 60 words.
- Choose each service "icon" ONLY from this list: Activity, Aperture, Briefcase, Camera, ChefHat, CheckCircle2, Code2, Coffee, Database, Dumbbell, Flame, Gauge, Heart, HeartPulse, Image, Layout, Lightbulb, Palette, PenTool, Rocket, ShieldPlus, Sparkles, Star, Stethoscope, Target, TrendingUp, Trophy, UtensilsCrossed, Wine.

You also DECIDE THE PAGE STRUCTURE. Return an ordered "sections" array choosing only from these block types, in the order they should appear after the hero:
- "about"        — a short narrative + heading
- "skills"       — an auto-scrolling marquee of technologies/tools mastered (great early on a profile/portfolio)
- "experience"   — career/role timeline (best for a PERSON's profile). Each role should be substantial: company, dates, the tech/tools used, and a couple of concrete achievement bullets — not a single line.
- "projects"     — PERSONAL / side project cards shown in a slider (distinct from employment; great for profiles & portfolios)
- "portfolio"    — project / work cards grid (best for designers, photographers, developers)
- "casestudy"    — ONE featured project told in depth (portfolio sites; leads with the strongest piece before the grid)
- "gallery"      — a grid of real photos (ONLY if photos exist; best for local businesses)
- "hours"        — store opening hours + embedded map (ONLY when hours or location data exist; business sites)
- "services"     — what they offer
- "menu"         — a menu / price list (ONLY for restaurants, cafés & food businesses)
- "certifications" — licenses, awards, degrees (only names from input; expand each with a one-line detail)
- "languages"    — spoken languages (only if present)
- "interests"    — hobbies / interests (only if present)
- "faq"          — 3-5 frequently asked questions with concise answers (great for converting visitors; fits any site)
- "stats"        — headline numbers (only if meaningful, non-fabricated)
- "testimonials" — only if real testimonials exist
- "cta"          — closing call-to-action (always last)
Pick the blocks that FIT this business and SKIP the rest. Do not include a block when its content is empty. Never repeat a block type. A sparse profile should still feel full: use skills, experience, projects, certifications, languages and interests to give it substance.

You ALSO choose the visual design from these closed sets (pick names only):
- "visualKit": the overall UI-kit look — one of "clean" (modern shadcn-style: subtle borders, restrained), "material" (Material-inspired: borderless elevated cards, lifted buttons), "editorial" (serif headings, sharp edges, magazine feel), "soft" (friendly, rounded, gentle shadows), "bold" (heavy weights, big radius, strong shadows). Match it to the business's personality; vary it so different businesses feel different.
- "styleTheme": one of "minimal" (clean, restrained), "editorial" (serif headings, sharp edges, magazine feel), "bold" (heavy weights, big radius, strong shadows), "warm" (soft rounded, friendly) — keep it consistent with the visualKit.
- "density": "compact" | "comfortable" | "airy".
- "variants": layout per block — "services": "bento" | "cards" | "list"; "work": "grid" | "masonry"; "testimonials": "cards" | "marquee" (a moving slider); "gallery": "masonry" | "carousel" (a slider).
Choose a combination that suits THIS business; vary it so different businesses feel different.`;

const ARCHETYPE_BRIEF: Record<Archetype, string> = {
  profile:
    "This is a PERSONAL PROFILE site for an individual (built from a resume/CV/LinkedIn). Build a RICH page: lead with who they are — the 'about' block must be substantial (2-3 paragraphs, not a single line), then 'skills' (tech mastered), an 'experience' timeline, personal 'projects', and where present 'certifications', 'languages' and 'interests'. Do NOT include a 'services' block — a CV is about history, skills and projects, not offerings.",
  business:
    "This is a LOCAL BUSINESS site (e.g. from Google Business). Lead with what they OFFER and trust signals: use 'services' prominently, a 'gallery' if photos exist, and 'hours' when opening hours or a map are available. For a restaurant/café/food business, ALSO include a 'menu'. Close with a 'faq' that answers common visitor questions. Do NOT include an 'experience' timeline, 'skills', 'projects', 'certifications', 'languages' or 'interests' — those are for people, not businesses.",
  portfolio:
    "This is a PORTFOLIO site for a maker (designer/photographer/developer/freelancer). Open with a 'casestudy' featuring the single strongest project, then the WORK via 'projects' (slider) and/or 'portfolio' (grid), plus 'skills'. 'experience', 'certifications' and a closing 'faq' are allowed; 'services' is secondary.",
};

function buildPrompt(input: GeneratorInput, base: SiteData): string {
  const hasPhotos = base.gallery.length > 0;
  return `Create the website content AND structure for this business.

SITE TYPE: ${base.archetype.toUpperCase()} (chosen by the user — you MUST respect it; do not turn a profile into a business or vice-versa)
${ARCHETYPE_BRIEF[base.archetype]}
Photos available for a gallery: ${hasPhotos ? `yes (${base.gallery.length})` : "no"}.

BUSINESS PROFILE (facts to use — do not contradict these):
${JSON.stringify(
    {
      name: input.name,
      domain: input.domain,
      theme: input.theme,
      tagline: input.tagline,
      bio: input.bio,
      location: input.location,
      email: input.email,
      phone: input.phone,
      services: input.services,
      work: input.work,
      testimonials: input.testimonials,
    },
    null,
    2
  )}

A safe template version is below for reference on TONE and COMPLETENESS. Improve on it — make the copy specific to THIS business, not generic:
${JSON.stringify({ ...base, gallery: undefined }, null, 2)}

Return ONLY a JSON object with EXACTLY this shape:
{
  "identity": { "tagline": string, "intro": string },
  "sectionLabels": { "services": string, "work": string, "testimonials": string },
  "bio": { "heading": string, "body": string, "stats": [ { "label": string, "value": string } ] },
  "services": [ { "title": string, "description": string, "icon": string } ],
  "work": [ { "title": string, "description": string, "tag": string, "period": string, "tech": [ string ], "highlights": [ string ] } ],
  "projects": [ { "title": string, "description": string, "tag": string, "tech": [ string ], "link": string } ],
  "skills": [ string ],
  "certifications": [ { "name": string, "detail": string } ],
  "languages": [ string ],
  "interests": [ string ],
  "menu": [ { "name": string, "description": string, "price": string, "category": string, "tag": string } ],
  "faq": [ { "question": string, "answer": string } ],
  "testimonials": [ { "quote": string, "author": string, "role": string } ],
  "cta": { "heading": string, "subtext": string, "buttonLabel": string },
  "sections": [ { "type": one of the allowed block types, "label": short eyebrow, "heading": section heading } ],
  "design": { "visualKit": string, "styleTheme": string, "density": string, "variants": { "services": string, "work": string, "testimonials": string, "gallery": string } }
}
Return only services, work, projects, testimonials, statistics, and menu items that are directly supported by the supplied profile. Empty is better than invented content; do not fill quotas. For each factual work item: "tag" = company or category; "period" = dates if known (e.g. "2021 — Present"); "tech" = technologies actually supplied; "highlights" = short achievements grounded in the input. "skills" = supplied technologies/tools only. "languages"/"interests" = copy from the input when present, else []. For "certifications": include ONLY names present in the input — never invent new credentials. For each name, write "detail" as one helpful line (12-20 words) explaining what it validates or demonstrates; you may use well-known public knowledge about major certs (AWS, PMP, CPA, etc.) but do NOT invent issuer, date, score, or ID numbers.${base.archetype === "profile" ? ' For profile sites, bio.body MUST be 2-3 paragraphs separated by blank lines (use \\n\\n), 100-150 words — expand thoughtfully from the resume bio and work history.' : ""} NEVER invent tech, dates, services, menu items, client names, testimonials, statistics, or metrics. "menu" must be [] unless menu items are explicitly present in the input. "faq" = 3-5 short, genuinely useful question/answer pairs a real visitor would ask this business (location, booking, pricing approach, what to expect) — answers <= 35 words and must not invent specific facts. The "cta" must fit the site type (profile/portfolio = hire/collaborate/contact). The "sections" array is the ordered page structure you choose for THIS ${base.archetype} site — pick the blocks that fit and skip the rest. Do not include any keys beyond those shown.`;
}

interface AiSite {
  identity?: { tagline?: string; intro?: string };
  sectionLabels?: { services?: string; work?: string; testimonials?: string };
  bio?: { heading?: string; body?: string; stats?: Stat[] };
  services?: { title?: string; description?: string; icon?: string }[];
  work?: {
    title?: string;
    description?: string;
    tag?: string;
    period?: string;
    tech?: unknown;
    highlights?: unknown;
  }[];
  projects?: {
    title?: string;
    description?: string;
    tag?: string;
    tech?: unknown;
    link?: string;
  }[];
  skills?: unknown;
  certifications?: unknown;
  languages?: unknown;
  interests?: unknown;
  menu?: {
    name?: string;
    description?: string;
    price?: string;
    category?: string;
    tag?: string;
  }[];
  faq?: { question?: string; answer?: string }[];
  testimonials?: { quote?: string; author?: string; role?: string }[];
  cta?: { heading?: string; subtext?: string; buttonLabel?: string };
  sections?: unknown;
  design?: unknown;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

// Clean a list of short strings (tech chips / achievement bullets). Returns
// undefined when empty so the field stays optional on WorkItem.
function strArray(v: unknown, max: number, len: number): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .slice(0, max)
    .map((s) => s.slice(0, len));
  return out.length ? out : undefined;
}

// Overlay AI output on the complete template base. The base guarantees a valid,
// fully-populated SiteData; AI improves the copy. Identity/theme/contact are
// forced from the user's input so AI can't drift on facts.
function mergeSite(base: SiteData, ai: AiSite, input: GeneratorInput): SiteData {
  const manualSource = !input.source || input.source === "manual";
  const services: ServiceItem[] = input.services?.length
    ? base.services.map((service, i) => ({
        ...service,
        description: str(ai.services?.[i]?.description, service.description),
      }))
    : manualSource && Array.isArray(ai.services) && ai.services.length
      ? ai.services.slice(0, 4).map((s, i) => ({
          title: str(s.title, base.services[i]?.title ?? "Service"),
          description: str(s.description, base.services[i]?.description ?? ""),
          icon:
            s.icon && ALLOWED_ICONS.has(s.icon)
              ? s.icon
              : base.services[i]?.icon ?? "Sparkles",
        }))
      : base.services;

  const work: WorkItem[] = input.work?.length
    ? base.work.map((item, i) => ({
        ...item,
        description: str(ai.work?.[i]?.description, item.description),
      }))
    : manualSource && Array.isArray(ai.work) && ai.work.length
      ? ai.work.slice(0, 5).map((w, i) => ({
          title: str(w.title, base.work[i]?.title ?? "Highlight"),
          description: str(w.description, base.work[i]?.description ?? ""),
          tag: str(w.tag, base.work[i]?.tag ?? ""),
          period: str(w.period, base.work[i]?.period ?? "") || undefined,
          tech: strArray(w.tech, 6, 24) ?? base.work[i]?.tech,
          highlights: strArray(w.highlights, 3, 160) ?? base.work[i]?.highlights,
        }))
      : base.work;

  const projects: WorkItem[] = input.projects?.length
    ? base.projects.map((item, i) => ({
        ...item,
        description: str(ai.projects?.[i]?.description, item.description),
      }))
    : manualSource && Array.isArray(ai.projects) && ai.projects.length
      ? ai.projects.slice(0, 6).map((p, i) => ({
          title: str(p.title, base.projects[i]?.title ?? "Project"),
          description: str(p.description, base.projects[i]?.description ?? ""),
          tag: str(p.tag, base.projects[i]?.tag ?? "") || undefined,
          tech: strArray(p.tech, 6, 24) ?? base.projects[i]?.tech,
          link: str(p.link, base.projects[i]?.link ?? "") || undefined,
        }))
      : base.projects;

  // Skills / languages / interests: trust AI's copy if it returned any.
  // Certifications: keep exact names from base (resume); AI fills detail lines.
  const skills = strArray(ai.skills, 24, 28) ?? base.skills;
  const certifications = mergeCertifications(ai.certifications, base.certifications);
  const languages = strArray(ai.languages, 8, 40) ?? base.languages;
  const interests = strArray(ai.interests, 10, 40) ?? base.interests;

  // Testimonials are factual source data. AI may rewrite surrounding copy but
  // cannot create or replace customer quotes.
  const testimonials: Testimonial[] = base.testimonials;

  const stats: Stat[] = base.bio.stats;

  const menu: MenuItem[] | undefined = base.menu;

  const faq: FaqItem[] | undefined = Array.isArray(ai.faq)
    ? ai.faq
        .filter((f) => f && f.question && f.answer)
        .slice(0, 6)
        .map((f) => ({
          question: String(f.question).slice(0, 160),
          answer: String(f.answer).slice(0, 400),
        }))
    : undefined;

  const merged: SiteData = {
    identity: {
      ...base.identity,
      tagline: str(ai.identity?.tagline, base.identity.tagline),
      intro: str(ai.identity?.intro, base.identity.intro),
    },
    theme: input.theme, // forced from user choice
    accent: input.accent ?? base.accent, // analysis choice, else domain default
    heroLayout: base.heroLayout, // derived from whether a photo was added
    archetype: base.archetype,
    design: sanitizeDesign(ai.design, base.archetype, input.visualKit), // AI-chosen, validated; user kit forced
    sections: [], // set below once content is merged
    sectionLabels: {
      services: str(ai.sectionLabels?.services, base.sectionLabels.services),
      work: str(ai.sectionLabels?.work, base.sectionLabels.work),
      testimonials: str(ai.sectionLabels?.testimonials, base.sectionLabels.testimonials),
    },
    bio: {
      heading: str(ai.bio?.heading, base.bio.heading),
      body: str(ai.bio?.body, base.bio.body),
      stats,
    },
    services,
    work,
    projects,
    skills,
    certifications,
    languages,
    interests,
    testimonials,
    menu: menu?.length ? menu : base.menu,
    faq: faq?.length ? faq : base.faq,
    gallery: base.gallery,
    storeHours: base.storeHours,
    mapEmbedUrl: base.mapEmbedUrl,
    mapsUrl: base.mapsUrl,
    cta: {
      heading: str(ai.cta?.heading, base.cta.heading),
      subtext: str(ai.cta?.subtext, base.cta.subtext),
      buttonLabel: str(ai.cta?.buttonLabel, base.cta.buttonLabel),
      href: base.cta.href,
    },
  };

  // The AI chose the ordering; sanitizeSections validates it against what we
  // can actually render and falls back to the template ordering if needed.
  merged.sections = sanitizeSections(ai.sections, merged);
  return merged;
}

export async function aiGenerateSite(input: GeneratorInput): Promise<SiteData> {
  const base = generateSite(input);
  const ai = await completeJSON<AiSite>(buildPrompt(input, base), {
    system: SYSTEM_PROMPT,
    temperature: 0.6,
    maxTokens: 2500,
  });
  return mergeSite(base, ai, input);
}
