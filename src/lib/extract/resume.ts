import "server-only";

import { analyzeText } from "@/lib/extract/shared";
import type { AnalysisResult } from "@/lib/types";

const CONTEXT =
  "The source material is a resume / CV. Turn the person's headline role into a tagline, their summary into a bio, their skills or service areas into services, and their roles/positions into work items. For each work item capture the company (tag), the dates (period), the technologies/tools used (tech), and 1-3 concrete achievement bullets (highlights) — do not flatten a role into a single line. List any certifications, licenses, awards, or degrees. Only include testimonials if the resume literally quotes one.";

export async function extractFromResumeText(text: string): Promise<AnalysisResult> {
  return analyzeText(text, CONTEXT, "resume");
}

// Max characters we'll feed into the AI extractor. A typical 3-page CV is
// ~3 000 chars; 20 000 is generous for even a long PDF without OOM risk.
const PDF_TEXT_LIMIT = 20_000;

export async function extractFromPdf(bytes: Uint8Array): Promise<AnalysisResult> {
  const { extractText: pdfExtractText, getDocumentProxy } = await import("unpdf");

  // Step 1: open the document — throws on password-protected or corrupted files.
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>>;
  try {
    pdf = await getDocumentProxy(bytes);
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : "";
    if (msg.includes("password") || msg.includes("encrypt")) {
      throw new Error(
        "That PDF is password-protected. Remove the password and try again, or paste the text instead."
      );
    }
    throw new Error(
      "Couldn't open that PDF — it may be corrupted or in an unsupported format. Try pasting the text instead."
    );
  }

  // Step 2: extract text (mergePages collapses all pages to one string).
  let joined: string;
  try {
    const { text } = await pdfExtractText(pdf, { mergePages: true });
    joined = Array.isArray(text) ? text.join("\n") : text;
  } catch {
    throw new Error(
      "Failed to read the PDF content. Try pasting the text instead."
    );
  }

  // Step 3: guard against scanned/image-only PDFs.
  if (!joined.trim()) {
    throw new Error(
      "No readable text found in that PDF — it may be a scanned image. " +
        "Try pasting your resume text instead."
    );
  }

  // Step 4: truncate before the AI call. A 100-page PDF can produce 300 k+ chars;
  // the AI prompt already slices to 12 000 but we truncate here first to avoid
  // passing a huge string through the whole call stack.
  const truncated = joined.slice(0, PDF_TEXT_LIMIT);

  return extractFromResumeText(truncated);
}
