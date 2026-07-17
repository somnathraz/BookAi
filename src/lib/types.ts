// The stable contract every generated site renders from.
// Today a template produces this; later an AI provider (Claude / Gemini / OpenAI)
// produces the same shape from a resume, Google Maps reviews, or LinkedIn data.

export type ThemeMode = "light" | "dark";

export type BusinessDomain =
  | "developer"
  | "designer"
  | "doctor"
  | "consultant"
  | "photographer"
  | "restaurant"
  | "fitness"
  | "other";

// Outbound links we surface as contact / social buttons. All optional —
// the renderer only shows the ones that are present.
export interface SocialLinks {
  whatsapp?: string; // raw phone-ish string; rendered via wa.me/<digits>
  github?: string;
  linkedin?: string;
  instagram?: string;
  website?: string;
}

export interface SiteIdentity {
  name: string;
  tagline: string;
  intro: string;
  domain: BusinessDomain;
  location?: string;
  email?: string;
  phone?: string;
  /** Headshot / logo as a data URL or remote URL. Resumes & LinkedIn don't
   *  expose one, so the user is asked to upload it in the analysis step. */
  photo?: string;
  socials?: SocialLinks;
}

export interface Stat {
  label: string;
  value: string;
}

export interface SiteBio {
  heading: string;
  body: string;
  stats: Stat[];
}

export interface ServiceItem {
  title: string;
  description: string;
  icon: string; // lucide icon name, resolved by the renderer's icon registry
}

export interface WorkItem {
  /** Role title (profile/experience) or project title (portfolio/projects). */
  title: string;
  /** One-line summary of the role/project. */
  description: string;
  /** Company / category badge (e.g. "Acme Corp" or "SaaS"). */
  tag?: string;
  /** Timeframe for an experience entry, e.g. "2021 — Present". */
  period?: string;
  /** Technologies / tools used — rendered as chips / brand logos. */
  tech?: string[];
  /** Achievement bullets so an entry is more than a one-liner. */
  highlights?: string[];
  /** Optional link to the live project / repo (personal projects). */
  link?: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  role?: string;
  rating?: number;
  /** True for reviews pulled from a verified source (e.g. Google Business). */
  verified?: boolean;
}

/** A certification, license, award, or degree shown on profile/portfolio sites. */
export interface CertificationItem {
  name: string;
  /** One-line context — what the credential validates or demonstrates. */
  detail: string;
}

export interface SiteCTA {
  heading: string;
  subtext: string;
  buttonLabel: string;
  href?: string;
}

/** Booking / inquiry settings on a published business site. */
export interface BookingConfig {
  enabled: boolean;
  /** Email that receives form submissions. Defaults to the site owner's account email. */
  notifyEmail?: string;
  /** Optional services shown in the form dropdown. */
  services?: string[];
  /** WhatsApp number (digits) for wa.me prefill — Basic tier. */
  whatsappNumber?: string;
  /** External scheduler URL (Calendly, Cal.com) — Phase 3. */
  calendarUrl?: string;
  /** Custom primary button label, e.g. "Request appointment". */
  buttonLabel?: string;
  /** PaperChai-native slot scheduling (Phase 4). */
  native?: NativeSchedulingConfig;
}

/** Weekly availability for native slot booking. */
export interface DaySlotConfig {
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  /** 24h time, e.g. "09:00" */
  start: string;
  /** 24h time, e.g. "17:30" */
  end: string;
}

export interface NativeSchedulingConfig {
  enabled: boolean;
  /** Slot length in minutes. Default 30. */
  slotMinutes?: number;
  weekly: DaySlotConfig[];
  /** ISO dates (YYYY-MM-DD) with no availability. */
  blackoutDates?: string[];
}

export type BookingStatus = "pending" | "contacted" | "cancelled" | "done";

/** One row in the store-hours grid (e.g. "Monday – Wednesday"). */
export interface HoursRow {
  label: string;
  hours: string;
}

/** Opening hours pulled from Google Business (business sites). */
export interface StoreHours {
  /** Captured at generation time — kept only as a fallback; the live site
   *  recomputes open/closed from `days` against the viewer's clock. */
  openNow?: boolean;
  /** Grouped rows for display (e.g. "Mon – Wed"). */
  rows: HoursRow[];
  /** Ungrouped per-day hours, used to compute "open now" on the live site and
   *  to emit opening-hours structured data. Day is the full weekday name. */
  days?: HoursRow[];
}

/** A single menu / price-list item (restaurant & food business sites). */
export interface MenuItem {
  name: string;
  description?: string;
  /** Display price string, e.g. "₹240" — kept as text so currency is flexible. */
  price?: string;
  /** Optional grouping, e.g. "Starters", "Mains", "Drinks". */
  category?: string;
  /** Optional flag, e.g. "Chef's pick", "Bestseller". */
  tag?: string;
}

/** A frequently-asked question and its answer. */
export interface FaqItem {
  question: string;
  answer: string;
}

export interface SectionLabels {
  services: string;
  work: string;
  testimonials: string;
}

// Hero composition. "split" pairs copy with the user's photo; "centered" is
// the photo-free, text-forward layout. Chosen per-user so no two sites are
// laid out identically.
export type HeroLayout = "centered" | "split";

// What kind of site we're building. Derived from the source + domain so the
// composition never overlaps (a resume becomes a person profile, a Google
// Business becomes a business site, a designer/photographer a portfolio).
export type Archetype = "profile" | "business" | "portfolio";

// Resume profiles need a different content hierarchy at the start of a career
// than later on. This is deliberately separate from `archetype`: both are
// personal profiles, but one leads with projects and the other with impact.
export type CareerStage = "early-career" | "experienced";

// The blocks a generated site can be composed from. The AI (or the template
// fallback) returns an ordered list of these; the renderer maps each to a
// component. Content for each block still lives on SiteData below.
export type SectionType =
  | "about"
  | "stats"
  | "skills" // infinite auto-scroll marquee of tech / tools mastered
  | "services"
  | "menu" // menu / price list — restaurant & food businesses
  | "experience" // roles / timeline — profile sites
  | "projects" // personal project cards in a slider — profile/portfolio
  | "portfolio" // project cards grid — portfolio sites
  | "casestudy" // one featured project, told in depth — portfolio sites
  | "gallery" // photo grid — business sites
  | "hours" // store hours + map — business sites
  | "certifications" // licenses, awards, degrees
  | "languages" // spoken languages
  | "interests" // hobbies / interests
  | "faq" // frequently asked questions — any archetype
  | "booking" // inquiry form — business sites with booking enabled
  | "testimonials"
  | "cta";

// One entry in the ordered composition. Optional copy overrides let the AI
// rename a block (e.g. a doctor's "experience" → "Specialities") without
// changing how it renders.
export interface SiteSection {
  type: SectionType;
  /** Small eyebrow label above the heading. */
  label?: string;
  /** Section heading. */
  heading?: string;
}

// ── Design system the AI drives (level 3 + 4) ─────────────────────────────────
// The AI picks names from these closed sets; the renderer maps them to real,
// tested components and tokens. This makes every site look different without
// ever producing broken or off-brand UI.

// Overall visual personality — fonts/weights, corner radius, shadows, spacing.
export type StyleTheme = "minimal" | "editorial" | "bold" | "warm";

// The component "look" / UI-kit the site is rendered in. This is the
// user-facing axis (Clean = shadcn, Material = Material-inspired, etc.). It is
// the authoritative source for surfaces, headings and button treatment; the
// renderer maps each kit to real, tested Tailwind tokens so no combination can
// ever produce broken or off-brand UI.
export type VisualKit = "clean" | "material" | "editorial" | "soft" | "bold";

// Vertical rhythm / whitespace.
export type Density = "compact" | "comfortable" | "airy";

// Per-section layout variants. Each is a different, prebuilt presentation of
// the same content (including sliders/carousels).
export type ServicesVariant = "bento" | "cards" | "list";
export type WorkVariant = "grid" | "masonry";
export type TestimonialsVariant = "cards" | "marquee";
export type GalleryVariant = "masonry" | "carousel";

export interface SectionVariants {
  services?: ServicesVariant;
  work?: WorkVariant;
  testimonials?: TestimonialsVariant;
  gallery?: GalleryVariant;
}

export interface SiteDesign {
  styleTheme: StyleTheme;
  /** The UI-kit look the site renders in. Optional for backwards-compat with
   *  older stored sites — the renderer derives one from styleTheme when absent. */
  visualKit?: VisualKit;
  density: Density;
  variants: SectionVariants;
}

export interface SiteData {
  identity: SiteIdentity;
  theme: ThemeMode;
  /** Optional brand accent (hex), derived from source images. Used sparingly
   *  over the neutral base — CTAs, badges, glows. */
  accent?: string;
  /** Per-user hero composition so generated sites differ from one another. */
  heroLayout: HeroLayout;
  /** The kind of site this is — drives the default section ordering. */
  archetype: Archetype;
  /** Resume/profile presentation. Optional so previously published sites keep
   *  their existing layout until they are regenerated. */
  careerStage?: CareerStage;
  /** Visual style + per-section layout variants. AI-chosen, validated. */
  design: SiteDesign;
  /** Ordered blocks to render after the hero. When present the renderer uses
   *  this; otherwise it falls back to the classic fixed order. */
  sections: SiteSection[];
  sectionLabels: SectionLabels;
  bio: SiteBio;
  services: ServiceItem[];
  work: WorkItem[];
  /** Personal / side projects, distinct from work experience. */
  projects: WorkItem[];
  /** Technologies / tools mastered — shown as an infinite marquee. */
  skills: string[];
  /** Certifications, licenses, awards, or degrees. */
  certifications: CertificationItem[];
  /** Spoken languages, e.g. "English", "Hindi (native)". */
  languages: string[];
  /** Hobbies / interests. */
  interests: string[];
  testimonials: Testimonial[];
  /** Menu / price-list items (restaurant & food businesses). */
  menu?: MenuItem[];
  /** Frequently asked questions (any archetype). */
  faq?: FaqItem[];
  /** Photo URLs for the gallery block (business sites). */
  gallery: string[];
  /** Store hours + map embed (business sites, usually from Google). */
  storeHours?: StoreHours;
  /** Google Maps iframe src for the location block. */
  mapEmbedUrl?: string;
  /** Link out to Google Maps for directions. */
  mapsUrl?: string;
  cta: SiteCTA;
  /** Online booking / inquiry form (business sites). */
  booking?: BookingConfig;
}

// What the input form (or future extractors) collects. Most fields optional —
// the generator fills domain-aware defaults for anything missing.
export interface GeneratorInput {
  /** How the factual content entered the builder. Imported sources never receive
   *  demo content when a field is missing. */
  source?: SourceId;
  name: string;
  domain: BusinessDomain;
  theme: ThemeMode;
  tagline?: string;
  bio?: string;
  location?: string;
  email?: string;
  phone?: string;
  services?: { title: string; description?: string }[];
  work?: {
    title: string;
    description?: string;
    tag?: string;
    period?: string;
    tech?: string[];
    highlights?: string[];
  }[];
  /** Personal / side projects, distinct from work experience. */
  projects?: {
    title: string;
    description?: string;
    tag?: string;
    tech?: string[];
    link?: string;
  }[];
  /** Technologies / tools mastered. */
  skills?: string[];
  /** Certifications, licenses, awards, degrees. */
  certifications?: string[];
  /** Spoken languages. */
  languages?: string[];
  /** Hobbies / interests. */
  interests?: string[];
  testimonials?: {
    quote: string;
    author: string;
    role?: string;
    rating?: number;
    verified?: boolean;
  }[];
  /** Brand accent (hex) chosen in the analysis step. */
  accent?: string;
  /** The UI-kit look the user explicitly picked. When set, it is forced and
   *  wins over the AI's choice; when omitted the AI / template decides. */
  visualKit?: VisualKit;
  /** Headshot / logo (data URL) uploaded in the analysis or review step. */
  photo?: string;
  /** Contact / social links surfaced as buttons on the generated site. */
  socials?: SocialLinks;
  /** The kind of site to build. Derived in analysis; defaulted from domain. */
  archetype?: Archetype;
  /** Selected during resume import. The extractor suggests a value, but the
   *  person always has the final say. */
  careerStage?: CareerStage;
  /** Photo URLs (e.g. Google Business photos) for a gallery block. */
  gallery?: string[];
  /** Store hours from Google Business. */
  storeHours?: StoreHours;
  mapEmbedUrl?: string;
  mapsUrl?: string;
  // When true (and a provider is configured) the AI writes the site copy;
  // otherwise the template engine is used. Defaults to AI-on when available.
  useAI?: boolean;
}

// ── Input sources & the analysis-reveal contract ──────────────────────────────

export type SourceId = "resume" | "maps" | "competitor" | "linkedin" | "manual";

export interface Capabilities {
  ai: boolean;
  provider: string | null;
  providers: { id: string; label: string }[];
  google: boolean;
  /** Server-side business name search is configured. */
  businessSearch?: boolean;
  /** Gmail/OTP configured — when false, the email gate is skipped. */
  email: boolean;
}

export interface Category {
  domain: BusinessDomain;
  label: string;
  confidence: number; // 0..1
}

// Everything the analysis step reveals before the user reaches the form.
export interface AnalysisResult {
  source: SourceId;
  profile: Partial<GeneratorInput>;
  images: string[];
  palette: string[]; // hex colors extracted from images
  categories: Category[];
  certifications: string[];
  reviews: { quote: string; author: string; role?: string }[];
}
