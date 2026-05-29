import "server-only";

import { aiAvailable, completeJSON } from "@/lib/ai/provider";
import type {
  AnalysisResult,
  BusinessDomain,
  Category,
  GeneratorInput,
  SocialLinks,
  SourceId,
} from "@/lib/types";

export type ExtractedProfile = Partial<GeneratorInput>;

const VALID_DOMAINS: BusinessDomain[] = [
  "developer",
  "designer",
  "doctor",
  "consultant",
  "photographer",
  "restaurant",
  "fitness",
  "other",
];

const DOMAIN_KEYWORDS: Record<BusinessDomain, string[]> = {
  developer: [
    "developer", "engineer", "software", "full-stack", "fullstack", "frontend",
    "backend", "react", "node", "saas", "programmer", "coding", "devops", "api",
  ],
  designer: [
    "designer", "ux", "ui", "graphic", "brand identity", "figma", "illustrat",
    "product design", "visual design",
  ],
  doctor: [
    "doctor", "clinic", "dental", "dentist", "physician", "hospital", "medical",
    "patient", "dr.", "healthcare", "surgeon", "therapy", "orthodont",
  ],
  consultant: [
    "consultant", "consulting", "advisor", "advisory", "strategy", "analyst",
    "business coach",
  ],
  photographer: [
    "photograph", "photo", "wedding shoot", "portrait", "videograph", "cinematograph",
  ],
  restaurant: [
    "restaurant", "cafe", "café", "bistro", "kitchen", "menu", "dining", "bakery",
    "eatery", "cuisine", "catering",
  ],
  fitness: [
    "fitness", "trainer", "gym", "yoga", "workout", "nutrition", "wellness",
    "pilates", "crossfit",
  ],
  other: [],
};

export function guessDomain(text: string): BusinessDomain {
  const lower = text.toLowerCase();
  let best: BusinessDomain = "other";
  let bestScore = 0;
  for (const domain of VALID_DOMAINS) {
    if (domain === "other") continue;
    const score = DOMAIN_KEYWORDS[domain].reduce(
      (acc, kw) => acc + (lower.includes(kw) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      best = domain;
    }
  }
  return best;
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_.-]+/i;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/[A-Za-z0-9_%-]+/i;
const INSTAGRAM_RE = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[A-Za-z0-9_.]+/i;

// Pull github / linkedin / instagram handles out of free text.
function socialsFromText(text: string): SocialLinks | undefined {
  const withProtocol = (m?: string) =>
    m ? (/^https?:\/\//i.test(m) ? m : `https://${m}`) : undefined;
  const socials: SocialLinks = {
    github: withProtocol(text.match(GITHUB_RE)?.[0]),
    linkedin: withProtocol(text.match(LINKEDIN_RE)?.[0]),
    instagram: withProtocol(text.match(INSTAGRAM_RE)?.[0]),
  };
  return Object.values(socials).some(Boolean) ? socials : undefined;
}

export function heuristicProfile(text: string): ExtractedProfile {
  const clean = text.replace(/\r/g, "").trim();
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
  const name = lines[0]?.slice(0, 80) || "";
  const paragraphs = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const bio = (paragraphs[1] || paragraphs[0] || "").replace(/\s+/g, " ").slice(0, 400);
  const email = clean.match(EMAIL_RE)?.[0];
  const phone = clean.match(PHONE_RE)?.[0]?.trim();
  return {
    name,
    domain: guessDomain(clean),
    bio: bio || undefined,
    email,
    phone,
    socials: socialsFromText(clean),
  };
}

const URL_MAX = 200;

// Keep only plausible http(s) URLs / handles, normalize to absolute URLs.
function sanitizeSocials(raw: SocialLinks | undefined): SocialLinks | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const norm = (v: unknown): string | undefined => {
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    if (!t) return undefined;
    const url = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    return url.slice(0, URL_MAX);
  };
  const socials: SocialLinks = {
    whatsapp: clampStr(raw.whatsapp, 40),
    github: norm(raw.github),
    linkedin: norm(raw.linkedin),
    instagram: norm(raw.instagram),
    website: norm(raw.website),
  };
  return Object.values(socials).some(Boolean) ? socials : undefined;
}

export function sanitizeProfile(p: ExtractedProfile): ExtractedProfile {
  const domain: BusinessDomain =
    p.domain && VALID_DOMAINS.includes(p.domain) ? p.domain : "other";
  return {
    name: typeof p.name === "string" ? p.name.slice(0, 80) : undefined,
    domain,
    tagline: clampStr(p.tagline, 120),
    bio: clampStr(p.bio, 600),
    location: clampStr(p.location, 80),
    email: clampStr(p.email, 120),
    phone: clampStr(p.phone, 40),
    services: Array.isArray(p.services)
      ? p.services
          .filter((s) => s && typeof s.title === "string" && s.title.trim())
          .slice(0, 4)
          .map((s) => ({
            title: s.title.slice(0, 60),
            description: clampStr(s.description, 160),
          }))
      : undefined,
    work: Array.isArray(p.work)
      ? p.work
          .filter((w) => w && typeof w.title === "string" && w.title.trim())
          .slice(0, 5)
          .map((w) => ({
            title: w.title.slice(0, 80),
            description: clampStr(w.description, 200) ?? "",
            tag: clampStr(w.tag, 60),
            period: clampStr(w.period, 40),
            tech: clampStrArray(w.tech, 8, 24),
            highlights: clampStrArray(w.highlights, 4, 160),
          }))
      : undefined,
    projects: Array.isArray(p.projects)
      ? p.projects
          .filter((w) => w && typeof w.title === "string" && w.title.trim())
          .slice(0, 6)
          .map((w) => ({
            title: w.title.slice(0, 80),
            description: clampStr(w.description, 200) ?? "",
            tag: clampStr(w.tag, 60),
            tech: clampStrArray(w.tech, 8, 24),
            link: clampStr(w.link, 200),
          }))
      : undefined,
    skills: clampStrArray(p.skills, 24, 28),
    languages: clampStrArray(p.languages, 8, 40),
    interests: clampStrArray(p.interests, 10, 40),
    testimonials: Array.isArray(p.testimonials)
      ? p.testimonials
          .filter((t) => t && typeof t.quote === "string" && t.quote.trim() && t.author)
          .slice(0, 4)
          .map((t) => ({
            quote: t.quote.slice(0, 400),
            author: String(t.author).slice(0, 60),
            role: clampStr(t.role, 60),
          }))
      : undefined,
    socials: sanitizeSocials(p.socials),
  };
}

function clampStr(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : undefined;
}

// Clean an array of short strings (tech chips, bullets). Returns undefined when
// nothing usable so the field stays optional.
function clampStrArray(
  v: unknown,
  max: number,
  len: number
): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .slice(0, max)
    .map((s) => s.slice(0, len));
  return out.length ? out : undefined;
}

const DOMAIN_LABELS: Record<BusinessDomain, string> = {
  developer: "Software Developer",
  designer: "Designer",
  doctor: "Doctor / Clinic",
  consultant: "Consultant",
  photographer: "Photographer",
  restaurant: "Restaurant / Cafe",
  fitness: "Fitness / Coach",
  other: "Business",
};

export function domainLabel(d: BusinessDomain): string {
  return DOMAIN_LABELS[d] ?? DOMAIN_LABELS.other;
}

function categoriesHeuristic(text: string): Category[] {
  const lower = text.toLowerCase();
  const scored = VALID_DOMAINS.filter((d) => d !== "other")
    .map((d) => ({
      domain: d,
      score: DOMAIN_KEYWORDS[d].reduce((a, kw) => a + (lower.includes(kw) ? 1 : 0), 0),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const max = scored[0]?.score || 1;
  const cats: Category[] = scored.map((s, i) => ({
    domain: s.domain,
    label: DOMAIN_LABELS[s.domain],
    confidence: Math.max(0.4, Math.min(1, s.score / max - i * 0.12)),
  }));
  if (!cats.length) cats.push({ domain: "other", label: DOMAIN_LABELS.other, confidence: 0.5 });
  return cats;
}

function sanitizeCategories(raw: unknown, fallback: BusinessDomain = "other"): Category[] {
  const out: Category[] = [];
  if (Array.isArray(raw)) {
    for (const c of raw) {
      const domain = (c?.domain as BusinessDomain) || fallback;
      if (!VALID_DOMAINS.includes(domain)) continue;
      if (out.some((o) => o.domain === domain)) continue;
      const confidence = typeof c?.confidence === "number" ? Math.max(0, Math.min(1, c.confidence)) : 0.6;
      out.push({ domain, label: DOMAIN_LABELS[domain], confidence });
      if (out.length >= 4) break;
    }
  }
  return out;
}

// Always surface the chosen profile domain as the top candidate.
function ensureDomain(cats: Category[], domain?: BusinessDomain): Category[] {
  const d = domain && VALID_DOMAINS.includes(domain) ? domain : "other";
  const rest = cats.filter((c) => c.domain !== d);
  return [{ domain: d, label: DOMAIN_LABELS[d], confidence: 1 }, ...rest].slice(0, 4);
}

function sanitizeStrings(raw: unknown, max = 12, len = 90): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .slice(0, max)
    .map((s) => s.slice(0, len));
}

const EXTRACT_SYSTEM =
  "You turn raw professional or business information into a structured profile for a polished one-page marketing website. Extract only facts that are present or strongly implied — never invent achievements, clients, or numbers. Allowed domains: developer, designer, doctor, consultant, photographer, restaurant, fitness, other.";

interface AnalyzeCore {
  profile: ExtractedProfile;
  categories: Category[];
  certifications: string[];
}

interface AiAnalyzeShape extends ExtractedProfile {
  categories?: { domain?: BusinessDomain; label?: string; confidence?: number }[];
  certifications?: string[];
}

async function aiAnalyzeCore(rawText: string, context: string): Promise<AnalyzeCore> {
  const prompt = `${context}

SOURCE MATERIAL:
"""
${rawText.slice(0, 12000)}
"""

Return ONLY a JSON object (omit any field you cannot determine, do not guess):
{
  "name": string,
  "domain": "developer" | "designer" | "doctor" | "consultant" | "photographer" | "restaurant" | "fitness" | "other",
  "tagline": string,            // <= 12 words, benefit-driven
  "bio": string,                // <= 55 words
  "location": string,
  "email": string,
  "phone": string,
  "services": [ { "title": string, "description": string } ],   // max 4
  "work": [ { "title": string, "description": string, "tag": string, "period": string, "tech": [ string ], "highlights": [ string ] } ],  // EMPLOYMENT roles only, max 5. tag = company; period = dates like "2021 — Present"; tech = tools used; highlights = 1-3 concrete achievement bullets. Only facts in the source.
  "projects": [ { "title": string, "description": string, "tag": string, "tech": [ string ], "link": string } ],  // PERSONAL / side projects (NOT jobs), max 6. tech = technologies used; link = URL if present.
  "skills": [ string ],          // technologies / tools / skills mastered, max 24 (e.g. "React", "TypeScript", "Figma")
  "languages": [ string ],       // spoken languages, e.g. "English (fluent)", "Hindi (native)"
  "interests": [ string ],       // hobbies / interests, max 10
  "testimonials": [ { "quote": string, "author": string, "role": string } ],  // only real ones from the source
  "categories": [ { "domain": one allowed domain, "label": short human label, "confidence": 0..1 } ],  // best-fit first, 3-4 candidates
  "certifications": [ string ],  // certifications, licenses, awards, or degrees explicitly present; else []
  "socials": { "github": string, "linkedin": string, "instagram": string, "website": string }  // only links explicitly present; omit the object if none
}`;

  const parsed = await completeJSON<AiAnalyzeShape>(prompt, {
    system: EXTRACT_SYSTEM,
    temperature: 0.2,
    maxTokens: 1800,
  });
  const { categories, certifications, ...profileFields } = parsed;
  const profile = sanitizeProfile(profileFields);
  return {
    profile,
    categories: sanitizeCategories(categories, profile.domain),
    certifications: sanitizeStrings(certifications),
  };
}

// AI when configured, else a heuristic — so the analysis step always has data.
export async function analyzeCore(rawText: string, context: string): Promise<AnalyzeCore> {
  if (aiAvailable()) {
    try {
      return await aiAnalyzeCore(rawText, context);
    } catch {
      /* fall through to heuristic */
    }
  }
  const profile = heuristicProfile(rawText);
  return { profile, categories: categoriesHeuristic(rawText), certifications: [] };
}

export function buildAnalysis(
  source: SourceId,
  core: AnalyzeCore,
  opts: { images?: string[]; palette?: string[] } = {}
): AnalysisResult {
  const reviews = (core.profile.testimonials ?? []).map((t) => ({
    quote: t.quote,
    author: t.author,
    role: t.role,
  }));
  return {
    source,
    // Certifications are surfaced in the reveal UI AND carried on the profile
    // so they flow through to the generated site.
    profile: { ...core.profile, certifications: core.certifications },
    images: (opts.images ?? []).filter(Boolean).slice(0, 20),
    palette: (opts.palette ?? []).filter(Boolean).slice(0, 6),
    categories: ensureDomain(core.categories, core.profile.domain),
    certifications: core.certifications,
    reviews,
  };
}

// Convenience for text-only sources (resume / LinkedIn).
export async function analyzeText(
  rawText: string,
  context: string,
  source: SourceId
): Promise<AnalysisResult> {
  const core = await analyzeCore(rawText, context);
  return buildAnalysis(source, core);
}
