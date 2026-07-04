import type { GeneratorInput, SiteData } from "@/lib/types";

/** Map stored site data back into the builder form for post-publish editing. */
export function siteToGeneratorInput(site: SiteData): GeneratorInput {
  const { identity } = site;
  return {
    name: identity.name,
    domain: identity.domain,
    theme: site.theme,
    tagline: identity.tagline,
    bio: site.bio.body || identity.intro,
    location: identity.location,
    email: identity.email,
    phone: identity.phone,
    photo: identity.photo,
    socials: identity.socials,
    accent: site.accent,
    archetype: site.archetype,
    visualKit: site.design.visualKit,
    services: site.services.map((s) => ({
      title: s.title,
      description: s.description,
    })),
    work: site.work.map((w) => ({
      title: w.title,
      description: w.description,
      tag: w.tag,
      period: w.period,
      tech: w.tech,
      highlights: w.highlights,
    })),
    projects: site.projects.map((p) => ({
      title: p.title,
      description: p.description,
      tag: p.tag,
      tech: p.tech,
      link: p.link,
    })),
    skills: [...site.skills],
    certifications: site.certifications.map((c) => c.name),
    languages: [...site.languages],
    interests: [...site.interests],
    testimonials: site.testimonials.map((t) => ({
      quote: t.quote,
      author: t.author,
      role: t.role,
      rating: t.rating,
      verified: t.verified,
    })),
    gallery: site.gallery?.length ? [...site.gallery] : undefined,
    storeHours: site.storeHours,
    mapEmbedUrl: site.mapEmbedUrl,
    mapsUrl: site.mapsUrl,
    useAI: true,
  };
}
