// Shared labels, icons and preview data for the site-builder wizard. Keeps the
// interactive picker in sync with compose.ts section ordering.

import type { Archetype, BusinessDomain, SectionType } from "@/lib/types";

export const WIZARD_STEPS = [
  { id: 1, title: "Site type", subtitle: "What you're building" },
  { id: 2, title: "Look & feel", subtitle: "Theme and style" },
  { id: 3, title: "Your details", subtitle: "Name and content" },
] as const;

export const DOMAIN_META: {
  value: BusinessDomain;
  label: string;
  icon: string;
  hint: string;
}[] = [
  { value: "developer", label: "Developer", icon: "Code2", hint: "Code, products, tech" },
  { value: "designer", label: "Designer", icon: "Palette", hint: "UI, brand, creative" },
  { value: "doctor", label: "Doctor", icon: "Stethoscope", hint: "Clinic, practice" },
  { value: "consultant", label: "Consultant", icon: "Briefcase", hint: "Advisory, strategy" },
  { value: "photographer", label: "Photographer", icon: "Camera", hint: "Photos, shoots" },
  { value: "restaurant", label: "Restaurant", icon: "UtensilsCrossed", hint: "Food, café, dining" },
  { value: "fitness", label: "Fitness", icon: "Dumbbell", hint: "Gym, coaching" },
  { value: "other", label: "Other", icon: "Sparkles", hint: "Anything else" },
];

export const ARCHETYPE_META: {
  id: Archetype;
  label: string;
  blurb: string;
  bestFor: string;
}[] = [
  {
    id: "profile",
    label: "Personal profile",
    blurb: "CV-style page with your story and career timeline.",
    bestFor: "Résumé, LinkedIn, job search",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    blurb: "Work-first page that leads with projects and case studies.",
    bestFor: "Designers, developers, makers",
  },
  {
    id: "business",
    label: "Business",
    blurb: "Services, photos, hours and reviews for local trust.",
    bestFor: "Shops, clinics, restaurants",
  },
];

/** Key sections shown in the live preview wireframe per archetype. */
export const ARCHETYPE_PREVIEW_SECTIONS: Record<
  Archetype,
  { type: SectionType; label: string }[]
> = {
  profile: [
    { type: "about", label: "About" },
    { type: "skills", label: "Skills" },
    { type: "experience", label: "Experience" },
    { type: "projects", label: "Projects" },
    { type: "certifications", label: "Certs" },
    { type: "cta", label: "Contact" },
  ],
  portfolio: [
    { type: "casestudy", label: "Featured work" },
    { type: "projects", label: "Projects" },
    { type: "skills", label: "Skills" },
    { type: "about", label: "About" },
    { type: "testimonials", label: "Reviews" },
    { type: "cta", label: "Contact" },
  ],
  business: [
    { type: "about", label: "About" },
    { type: "services", label: "Services" },
    { type: "gallery", label: "Photos" },
    { type: "hours", label: "Hours & map" },
    { type: "testimonials", label: "Reviews" },
    { type: "cta", label: "Book / visit" },
  ],
};

export const PRESET_ACCENTS = [
  "#6366f1",
  "#8b5cf6",
  "#3b82f6",
  "#0ea5e9",
  "#14b8a6",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
];
