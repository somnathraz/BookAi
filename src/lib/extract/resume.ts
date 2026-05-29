import "server-only";

import { analyzeText } from "@/lib/extract/shared";
import type { AnalysisResult } from "@/lib/types";

const CONTEXT =
  "The source material is a resume / CV. Turn the person's headline role into a tagline, their summary into a bio, their skills or service areas into services, and their roles/positions into work items. For each work item capture the company (tag), the dates (period), the technologies/tools used (tech), and 1-3 concrete achievement bullets (highlights) — do not flatten a role into a single line. List any certifications, licenses, awards, or degrees. Only include testimonials if the resume literally quotes one.";

export async function extractFromResumeText(text: string): Promise<AnalysisResult> {
  return analyzeText(text, CONTEXT, "resume");
}

export async function extractFromPdf(bytes: Uint8Array): Promise<AnalysisResult> {
  const { extractText: pdfExtractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await pdfExtractText(pdf, { mergePages: true });
  const joined = Array.isArray(text) ? text.join("\n") : text;
  if (!joined.trim()) {
    throw new Error("Couldn't read any text from that PDF. Try pasting the text instead.");
  }
  return extractFromResumeText(joined);
}
