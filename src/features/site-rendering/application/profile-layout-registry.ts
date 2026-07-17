import type { CareerStage, SiteData } from "@/lib/types";

export interface ProfileLayoutPreset {
  readonly id: CareerStage;
  readonly badgeLabel: string;
  readonly skillsFallback: string;
  readonly projectsFallback: string;
  readonly certificationsFallback: string;
  readonly prioritizeProjectProof: boolean;
}

/** Career-stage layout decisions live here, not across renderer sections. */
export const profileLayoutRegistry: Record<CareerStage, ProfileLayoutPreset> = {
  "early-career": {
    id: "early-career",
    badgeLabel: "Early-career portfolio",
    skillsFallback: "Skills I’m growing",
    projectsFallback: "Proof of what I can build",
    certificationsFallback: "Education & credentials",
    prioritizeProjectProof: true,
  },
  experienced: {
    id: "experienced",
    badgeLabel: "Experienced professional",
    skillsFallback: "Core strengths",
    projectsFallback: "Selected work",
    certificationsFallback: "Certifications & awards",
    prioritizeProjectProof: false,
  },
};

export function profileLayoutFor(site: Pick<SiteData, "archetype" | "careerStage">): ProfileLayoutPreset | null {
  if (site.archetype !== "profile" || !site.careerStage) return null;
  return profileLayoutRegistry[site.careerStage];
}
