import "server-only";

import { analyzeText } from "@/lib/extract/shared";
import type { AnalysisResult } from "@/lib/types";

const CONTEXT =
  "The source material is pasted text from a LinkedIn profile (headline, About section, experience, licenses & certifications). Turn the headline into a tagline, the About into a bio, roles/skills into services and work items, and list any certifications or licenses mentioned.";

export async function extractFromLinkedInText(text: string): Promise<AnalysisResult> {
  return analyzeText(text, CONTEXT, "linkedin");
}
