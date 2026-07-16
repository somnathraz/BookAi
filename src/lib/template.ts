import { deriveArchetype, defaultSections, defaultDesign } from "@/lib/compose";
import { enrichCertifications } from "@/lib/certifications";
import { buildMapEmbedUrl } from "@/lib/hours";
import type {
  Archetype,
  BusinessDomain,
  GeneratorInput,
  ServiceItem,
  SiteCTA,
  SiteData,
  SocialLinks,
  Stat,
  Testimonial,
  WorkItem,
  SectionLabels,
} from "@/lib/types";

interface DomainPreset {
  label: string;
  sectionLabels: SectionLabels;
  tagline: string;
  intro: string;
  bioHeading: string;
  bioBody: string;
  stats: Stat[];
  serviceIcons: string[];
  services: ServiceItem[];
  work: WorkItem[];
  testimonials: Testimonial[];
  cta: SiteCTA;
}

export const DOMAIN_PRESETS: Record<BusinessDomain, DomainPreset> = {
  developer: {
    label: "Software Developer",
    sectionLabels: {
      services: "What I build",
      work: "Selected work",
      testimonials: "What clients say",
    },
    tagline: "I build fast, scalable products that ship.",
    intro:
      "Full-stack engineer turning ideas into production-grade software — from first commit to scale.",
    bioHeading: "Engineering that earns its keep",
    bioBody:
      "I partner with founders and teams to design, build, and ship reliable software. Performance-minded, pragmatic, and obsessed with the details that make products feel fast.\n\nOver the past several years I've worked across the stack — from React and Node backends to databases and cloud deployment — always with an eye on maintainability and user experience.\n\nI'm most at home on greenfield products and hard technical problems. If you're building something ambitious and need someone who can own it end to end, let's talk.",
    stats: [
      { label: "Years building", value: "5+" },
      { label: "Products shipped", value: "30+" },
      { label: "Avg. load time", value: "<1s" },
    ],
    serviceIcons: ["Code2", "Rocket", "Gauge", "Database"],
    services: [
      {
        title: "Web & SaaS apps",
        description: "End-to-end product builds with modern, maintainable stacks.",
        icon: "Code2",
      },
      {
        title: "Performance tuning",
        description: "Make slow apps fast — Core Web Vitals, queries, and bundles.",
        icon: "Gauge",
      },
      {
        title: "MVP to scale",
        description: "From zero-to-one prototypes to systems that handle real load.",
        icon: "Rocket",
      },
    ],
    work: [
      {
        title: "Senior Software Engineer",
        tag: "Product company",
        period: "2021 — Present",
        description: "Lead engineer on a realtime analytics platform.",
        tech: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"],
        highlights: [
          "Built a realtime dashboard serving thousands of users.",
          "Owned architecture from API design to deployment.",
        ],
      },
      {
        title: "Full-stack Developer",
        tag: "Agency / startup",
        period: "2018 — 2021",
        description: "Shipped client products end to end.",
        tech: ["Next.js", "Express", "MongoDB", "Docker"],
        highlights: [
          "Rebuilt a marketplace and cut page load significantly.",
          "Set up CI/CD and testing for faster, safer releases.",
        ],
      },
      {
        title: "AI writing tool",
        tag: "Side project",
        description: "Streaming LLM product from concept to launch.",
        tech: ["React", "OpenAI", "Vercel"],
      },
    ],
    testimonials: [
      { quote: "Shipped faster than our whole team could have. Quality was outstanding.", author: "Priya S.", role: "Founder, SaaS startup", rating: 5 },
      { quote: "Our app went from sluggish to instant. Users noticed immediately.", author: "Arjun M.", role: "CTO", rating: 5 },
    ],
    cta: {
      heading: "Have a project in mind?",
      subtext: "Tell me what you're building and I'll tell you how I'd ship it.",
      buttonLabel: "Start a project",
    },
  },
  designer: {
    label: "Designer",
    sectionLabels: {
      services: "How I help",
      work: "Selected work",
      testimonials: "Kind words",
    },
    tagline: "Design that makes products feel inevitable.",
    intro:
      "Product and brand designer crafting clean, conversion-focused experiences people love to use.",
    bioHeading: "Design with intent",
    bioBody:
      "I help teams turn complex problems into simple, beautiful interfaces. Every pixel earns its place — from first wireframe to polished, shippable UI.",
    stats: [
      { label: "Years designing", value: "6+" },
      { label: "Projects", value: "40+" },
      { label: "Happy clients", value: "25+" },
    ],
    serviceIcons: ["PenTool", "Layout", "Palette", "Sparkles"],
    services: [
      { title: "Product & UX", description: "Flows, wireframes, and interfaces that convert.", icon: "Layout" },
      { title: "Brand & identity", description: "Logos, systems, and a voice that sticks.", icon: "Palette" },
      { title: "Design systems", description: "Scalable component libraries your team can ship with.", icon: "Sparkles" },
    ],
    work: [
      { title: "Fintech app redesign", description: "Reimagined onboarding, +35% activation.", tag: "Product" },
      { title: "Brand identity", description: "Full rebrand for a wellness startup.", tag: "Brand" },
      { title: "Design system", description: "60+ components powering 4 products.", tag: "Systems" },
    ],
    testimonials: [
      { quote: "Took our vague idea and turned it into something gorgeous and usable.", author: "Neha R.", role: "Product Lead", rating: 5 },
      { quote: "The redesign paid for itself in a month. Conversions jumped.", author: "Sam T.", role: "Founder", rating: 5 },
    ],
    cta: {
      heading: "Let's design something great",
      subtext: "Share your product or brand and let's make it feel inevitable.",
      buttonLabel: "Book a call",
    },
  },
  doctor: {
    label: "Doctor / Clinic",
    sectionLabels: {
      services: "Services offered",
      work: "Specialities",
      testimonials: "Patient reviews",
    },
    tagline: "Compassionate, expert care you can trust.",
    intro:
      "Providing personalised, evidence-based care with a focus on comfort, clarity, and lasting outcomes.",
    bioHeading: "Care that puts you first",
    bioBody:
      "With years of clinical experience, I'm committed to listening carefully, explaining clearly, and treating every patient with respect. Your health and comfort come first.",
    stats: [
      { label: "Years practising", value: "12+" },
      { label: "Patients treated", value: "8,000+" },
      { label: "Patient rating", value: "4.9★" },
    ],
    serviceIcons: ["Stethoscope", "HeartPulse", "Activity", "ShieldPlus"],
    services: [
      { title: "Consultations", description: "Thorough, unhurried appointments tailored to you.", icon: "Stethoscope" },
      { title: "Preventive care", description: "Screenings and check-ups to keep you healthy.", icon: "ShieldPlus" },
      { title: "Ongoing treatment", description: "Personalised plans with clear follow-up.", icon: "HeartPulse" },
    ],
    work: [
      { title: "General medicine", description: "Everyday health concerns, expertly handled.", tag: "Speciality" },
      { title: "Chronic care", description: "Long-term management with a personal touch.", tag: "Speciality" },
      { title: "Health screening", description: "Comprehensive preventive check-ups.", tag: "Speciality" },
    ],
    testimonials: [
      { quote: "Took the time to explain everything. I never felt rushed.", author: "Meera K.", role: "Patient", rating: 5 },
      { quote: "Genuinely caring and thorough. Highly recommend.", author: "Rohit D.", role: "Patient", rating: 5 },
    ],
    cta: {
      heading: "Book an appointment",
      subtext: "Choose a time that works for you — we'll confirm right away.",
      buttonLabel: "Book appointment",
    },
  },
  consultant: {
    label: "Consultant",
    sectionLabels: {
      services: "How I help",
      work: "Engagements",
      testimonials: "Client results",
    },
    tagline: "Clarity and results for ambitious teams.",
    intro:
      "I help businesses make sharper decisions, move faster, and grow — with strategy grounded in real outcomes.",
    bioHeading: "Strategy that ships",
    bioBody:
      "I work alongside leaders to cut through noise, find the highest-leverage moves, and execute. No fluff — just clear thinking and measurable progress.",
    stats: [
      { label: "Years advising", value: "10+" },
      { label: "Clients", value: "50+" },
      { label: "Avg. growth", value: "2.4x" },
    ],
    serviceIcons: ["Target", "TrendingUp", "Lightbulb", "Briefcase"],
    services: [
      { title: "Strategy sprints", description: "Focused engagements that unlock your next move.", icon: "Target" },
      { title: "Growth advisory", description: "Find and pull the levers that actually move revenue.", icon: "TrendingUp" },
      { title: "Operations", description: "Streamline how your team works and delivers.", icon: "Briefcase" },
    ],
    work: [
      { title: "Go-to-market reset", description: "Repositioned a B2B SaaS, doubled pipeline.", tag: "Strategy" },
      { title: "Ops overhaul", description: "Cut delivery time by 40%.", tag: "Operations" },
      { title: "Growth program", description: "Built a repeatable acquisition engine.", tag: "Growth" },
    ],
    testimonials: [
      { quote: "Brought clarity to a messy situation and a plan we could actually run.", author: "Anita V.", role: "CEO", rating: 5 },
      { quote: "Worth every rupee. Our numbers speak for themselves.", author: "Karan J.", role: "Founder", rating: 5 },
    ],
    cta: {
      heading: "Let's talk about your goals",
      subtext: "Book a discovery call and we'll map your highest-leverage moves.",
      buttonLabel: "Book a call",
    },
  },
  photographer: {
    label: "Photographer",
    sectionLabels: {
      services: "Sessions",
      work: "Portfolio",
      testimonials: "Client love",
    },
    tagline: "Moments worth keeping, beautifully captured.",
    intro:
      "Photographer telling honest, vivid stories — from weddings and portraits to brands that want to stand out.",
    bioHeading: "Light, story, feeling",
    bioBody:
      "I chase the real moments — the laugh between poses, the quiet glance. My work is warm, timeless, and made to be looked at for years.",
    stats: [
      { label: "Years shooting", value: "8+" },
      { label: "Shoots", value: "300+" },
      { label: "Five-star reviews", value: "150+" },
    ],
    serviceIcons: ["Camera", "Image", "Aperture", "Heart"],
    services: [
      { title: "Weddings", description: "Full-day storytelling, candid and timeless.", icon: "Heart" },
      { title: "Portraits", description: "Personal, brand, and family sessions.", icon: "Camera" },
      { title: "Commercial", description: "Product and brand imagery that sells.", icon: "Aperture" },
    ],
    work: [
      { title: "Beachside wedding", description: "A golden-hour celebration.", tag: "Wedding" },
      { title: "Studio portraits", description: "Editorial-style personal branding.", tag: "Portrait" },
      { title: "Product campaign", description: "Lifestyle shoot for a D2C brand.", tag: "Commercial" },
    ],
    testimonials: [
      { quote: "Captured our day exactly as it felt. We cried looking through them.", author: "Sneha & Aman", role: "Wedding clients", rating: 5 },
      { quote: "Professional, calm, and the photos were stunning.", author: "Divya P.", role: "Brand owner", rating: 5 },
    ],
    cta: {
      heading: "Let's create something beautiful",
      subtext: "Tell me about your shoot and I'll send availability and pricing.",
      buttonLabel: "Check availability",
    },
  },
  restaurant: {
    label: "Restaurant / Cafe",
    sectionLabels: {
      services: "What we offer",
      work: "On the menu",
      testimonials: "Guest reviews",
    },
    tagline: "Fresh flavours, warm hospitality.",
    intro:
      "A place to gather, eat well, and feel at home — crafted with care from the kitchen to your table.",
    bioHeading: "Made with love, served with pride",
    bioBody:
      "We cook honest food from quality ingredients, with a menu that celebrates flavour and a room that feels like home. Come hungry, leave happy.",
    stats: [
      { label: "Years serving", value: "7+" },
      { label: "Dishes", value: "60+" },
      { label: "Guest rating", value: "4.8★" },
    ],
    serviceIcons: ["UtensilsCrossed", "Coffee", "ChefHat", "Wine"],
    services: [
      { title: "Dine-in", description: "A cosy room and a menu worth lingering over.", icon: "UtensilsCrossed" },
      { title: "Takeaway", description: "Your favourites, ready to go.", icon: "Coffee" },
      { title: "Private events", description: "Celebrations and gatherings, catered with care.", icon: "ChefHat" },
    ],
    work: [
      { title: "Signature thali", description: "A taste of everything we love.", tag: "Bestseller" },
      { title: "Wood-fired pizzas", description: "Crisp, blistered, and fresh.", tag: "Popular" },
      { title: "House desserts", description: "Made in-house, daily.", tag: "Sweet" },
    ],
    testimonials: [
      { quote: "Best meal we've had in ages. The service made us feel like family.", author: "The Sharma family", role: "Regulars", rating: 5 },
      { quote: "Flavour-packed and beautifully presented. We'll be back.", author: "Vikram N.", role: "Guest", rating: 5 },
    ],
    cta: {
      heading: "Reserve a table",
      subtext: "Pick a date and party size — we'll save your spot.",
      buttonLabel: "Book a table",
    },
  },
  fitness: {
    label: "Fitness / Coach",
    sectionLabels: {
      services: "Programs",
      work: "Results",
      testimonials: "Member stories",
    },
    tagline: "Stronger, every single day.",
    intro:
      "Coaching that meets you where you are and gets you where you want to be — with plans that actually fit your life.",
    bioHeading: "Train smart, live strong",
    bioBody:
      "I build personalised programs around your goals, your schedule, and your body. Sustainable progress, real accountability, no fads.",
    stats: [
      { label: "Years coaching", value: "9+" },
      { label: "Clients trained", value: "200+" },
      { label: "Goal success", value: "92%" },
    ],
    serviceIcons: ["Dumbbell", "HeartPulse", "Flame", "Trophy"],
    services: [
      { title: "1:1 coaching", description: "Personalised plans and weekly accountability.", icon: "Dumbbell" },
      { title: "Group classes", description: "High-energy sessions that keep you coming back.", icon: "Flame" },
      { title: "Nutrition", description: "Simple, sustainable eating that fits your life.", icon: "HeartPulse" },
    ],
    work: [
      { title: "12-week transformation", description: "Strength and confidence, rebuilt.", tag: "Program" },
      { title: "Marathon prep", description: "From couch to finish line.", tag: "Endurance" },
      { title: "Postpartum return", description: "Safe, steady, strong again.", tag: "Recovery" },
    ],
    testimonials: [
      { quote: "Lost 12kg and gained a habit I actually enjoy. Life-changing.", author: "Pooja H.", role: "Member", rating: 5 },
      { quote: "Pushes me just enough. I've never been this consistent.", author: "Dev A.", role: "Member", rating: 5 },
    ],
    cta: {
      heading: "Start your journey",
      subtext: "Book a free intro session and let's build your plan.",
      buttonLabel: "Book free session",
    },
  },
  other: {
    label: "Business",
    sectionLabels: {
      services: "What we offer",
      work: "Highlights",
      testimonials: "What people say",
    },
    tagline: "Quality work, happy clients.",
    intro:
      "Dedicated to doing great work and building lasting relationships with the people we serve.",
    bioHeading: "About us",
    bioBody:
      "We care about getting the details right and treating every client like our only client. Here's a little about what we do and who we help.",
    stats: [
      { label: "Years in business", value: "5+" },
      { label: "Clients served", value: "100+" },
      { label: "Rating", value: "4.9★" },
    ],
    serviceIcons: ["Star", "CheckCircle2", "Heart", "Sparkles"],
    services: [
      { title: "Our core service", description: "Done with care and attention to detail.", icon: "CheckCircle2" },
      { title: "Tailored solutions", description: "We adapt to what you actually need.", icon: "Sparkles" },
      { title: "Ongoing support", description: "We're here long after the job's done.", icon: "Heart" },
    ],
    work: [
      { title: "Featured project", description: "A great example of what we do.", tag: "Highlight" },
      { title: "Happy client story", description: "Real results, real people.", tag: "Highlight" },
      { title: "Recent win", description: "Something we're proud of.", tag: "Highlight" },
    ],
    testimonials: [
      { quote: "Fantastic experience from start to finish. Highly recommend.", author: "Happy client", role: "Customer", rating: 5 },
      { quote: "Professional, friendly, and great at what they do.", author: "Satisfied customer", role: "Customer", rating: 5 },
    ],
    cta: {
      heading: "Get in touch",
      subtext: "Tell us what you need and we'll get right back to you.",
      buttonLabel: "Contact us",
    },
  },
};

function fallback<T>(value: T | undefined | null, def: T): T {
  if (value === undefined || value === null) return def;
  if (typeof value === "string" && value.trim() === "") return def;
  return value;
}

// Trim empty values and default WhatsApp to the contact phone when not given —
// most solo professionals use the same number.
function normalizeSocials(input: GeneratorInput): SocialLinks | undefined {
  const src = input.socials ?? {};
  const clean = (v?: string) => {
    const t = v?.trim();
    return t ? t : undefined;
  };
  const socials: SocialLinks = {
    whatsapp: clean(src.whatsapp) ?? clean(input.phone),
    github: clean(src.github),
    linkedin: clean(src.linkedin),
    instagram: clean(src.instagram),
    website: clean(src.website),
  };
  const hasAny = Object.values(socials).some(Boolean);
  return hasAny ? socials : undefined;
}

// Tasteful default accent per domain, so every generated site has a fitting
// colour identity even when the user doesn't pick one. An explicit choice in
// the analysis step always overrides this.
export const DOMAIN_ACCENT: Record<BusinessDomain, string> = {
  developer: "#6366f1", // indigo
  designer: "#8b5cf6", // violet
  doctor: "#14b8a6", // teal
  consultant: "#0ea5e9", // sky
  photographer: "#f59e0b", // amber
  restaurant: "#f97316", // orange
  fitness: "#10b981", // emerald
  other: "#6366f1",
};

// People-first CTAs for profile / portfolio sites, so a résumé never ends with
// a business-y "Book a table". Businesses keep their domain preset CTA.
const ARCHETYPE_CTA: Record<Archetype, SiteCTA | null> = {
  profile: {
    heading: "Let's work together",
    subtext: "Open to roles and collaborations — I'd love to hear from you.",
    buttonLabel: "Get in touch",
  },
  portfolio: {
    heading: "Have a project in mind?",
    subtext: "Tell me what you're building and let's make something great.",
    buttonLabel: "Start a project",
  },
  business: null, // keep the domain preset CTA
};

export function generateSite(input: GeneratorInput): SiteData {
  const preset = DOMAIN_PRESETS[input.domain] ?? DOMAIN_PRESETS.other;
  const icons = preset.serviceIcons;
  const imported = Boolean(input.source && input.source !== "manual");

  const services: ServiceItem[] =
    input.services && input.services.length > 0
      ? input.services.map((s, i) => ({
          title: s.title,
          description: fallback(s.description, "A service I'm proud to offer."),
          icon: icons[i % icons.length],
        }))
      : imported
        ? []
        : preset.services;

  const work: WorkItem[] =
    input.work && input.work.length > 0
      ? input.work.map((w) => ({
          title: w.title,
          description: fallback(w.description, ""),
          tag: fallback(w.tag, preset.sectionLabels.work),
          period: w.period,
          tech: w.tech?.length ? w.tech : undefined,
          highlights: w.highlights?.length ? w.highlights : undefined,
        }))
      : imported
        ? []
        : preset.work;

  const testimonials: Testimonial[] =
    input.testimonials && input.testimonials.length > 0
      ? input.testimonials.map((t) => ({
          quote: t.quote,
          author: t.author,
          role: t.role,
          rating: t.rating ?? 5,
          verified: t.verified,
        }))
      : [];

  const projects: WorkItem[] = (input.projects ?? [])
    .filter((p) => p.title?.trim())
    .slice(0, 6)
    .map((p) => ({
      title: p.title,
      description: fallback(p.description, ""),
      tag: p.tag,
      tech: p.tech?.length ? p.tech : undefined,
      link: p.link,
    }));

  // Skills: explicit list wins; otherwise union the tech used across roles and
  // projects so the marquee always has something real to show.
  const techUnion = Array.from(
    new Set(
      [...work, ...projects].flatMap((w) => w.tech ?? []).map((t) => t.trim()).filter(Boolean)
    )
  );
  const skills = (input.skills?.length ? input.skills : techUnion).slice(0, 24);
  const certifications = enrichCertifications(
    (input.certifications ?? []).filter(Boolean).slice(0, 12),
    input.domain
  );
  const languages = (input.languages ?? []).filter(Boolean).slice(0, 8);
  const interests = (input.interests ?? []).filter(Boolean).slice(0, 10);

  const socials = normalizeSocials(input);
  const archetype = input.archetype ?? deriveArchetype(input.domain);
  const gallery = (input.gallery ?? []).filter(Boolean).slice(0, 20);
  const mapEmbedUrl =
    input.mapEmbedUrl ?? buildMapEmbedUrl({ address: input.location });
  const cta: SiteCTA = {
    ...(ARCHETYPE_CTA[archetype] ?? preset.cta),
    href: input.email ? `mailto:${input.email}` : "#contact",
  };

  const site: SiteData = {
    identity: {
      name: input.name,
      tagline: fallback(input.tagline, preset.tagline),
      intro: fallback(input.bio ? input.bio : undefined, preset.intro),
      domain: input.domain,
      location: input.location,
      email: input.email,
      phone: input.phone,
      photo: input.photo,
      socials,
    },
    theme: input.theme,
    accent: input.accent ?? DOMAIN_ACCENT[input.domain] ?? DOMAIN_ACCENT.other,
    // A photo unlocks the split hero; otherwise stay text-forward and centered.
    heroLayout: input.photo ? "split" : "centered",
    archetype,
    design: defaultDesign(archetype, input.visualKit),
    sections: [], // filled by defaultSections once content is in place
    sectionLabels: preset.sectionLabels,
    bio: {
      heading: preset.bioHeading,
      body: fallback(input.bio, preset.bioBody),
      stats: [],
    },
    services,
    work,
    projects,
    skills,
    certifications,
    languages,
    interests,
    testimonials,
    gallery,
    storeHours: input.storeHours,
    mapEmbedUrl: archetype === "business" ? mapEmbedUrl : undefined,
    mapsUrl: input.mapsUrl,
    cta,
  };

  site.sections = defaultSections(site);
  return site;
}
