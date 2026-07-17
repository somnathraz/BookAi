import "server-only";

import { canGenerate, FREE_SITES_PER_IP, ipSiteCount } from "@/lib/accounts";
import { extractFromUrl } from "@/lib/extract/competitor";
import { extractFromLinkedInText } from "@/lib/extract/linkedin";
import { extractFromGoogleMaps } from "@/lib/extract/maps";
import { extractFromPdf, extractFromResumeText } from "@/lib/extract/resume";
import type { AnalysisResult } from "@/lib/types";
import { ApiError, apiErrors } from "@/platform/http/api-error";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export type ImportSource = "resume" | "linkedin" | "competitor" | "maps";

export async function assertImportAvailable(
  email: string | undefined,
  ip: string | undefined
): Promise<void> {
  if (email) {
    const gate = await canGenerate(email, ip);
    if (!gate.ok) {
      throw new ApiError(
        402,
        "limit_reached",
        gate.reason ?? "You've reached your current site limit."
      );
    }
    return;
  }

  if (ip && (await ipSiteCount(ip)) >= FREE_SITES_PER_IP) {
    throw new ApiError(
      402,
      "limit_reached",
      "You've reached the free limit for this network. Verify your email or upgrade to Basic for more."
    );
  }
}

export async function analyzeUpload(file: File): Promise<AnalysisResult> {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new ApiError(
      413,
      "file_too_large",
      `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Please upload a PDF under 5 MB, or paste the text instead.`
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      return await extractFromPdf(bytes);
    }
    return await extractFromResumeText(new TextDecoder().decode(bytes));
  } catch (error) {
    throw extractionError(error);
  }
}

export async function analyzeSource(input: {
  source?: string;
  text?: string;
  url?: string;
}): Promise<AnalysisResult> {
  try {
    switch (input.source as ImportSource | undefined) {
      case "resume":
        return await extractFromResumeText(requireText(input.text));
      case "linkedin":
        return await extractFromLinkedInText(requireText(input.text));
      case "competitor":
        return await extractFromUrl(requireUrl(input.url));
      case "maps":
        return await extractFromGoogleMaps(requireUrl(input.url));
      default:
        throw apiErrors.badRequest("Unknown source.");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw extractionError(error);
  }
}

function requireText(text?: string): string {
  if (!text?.trim()) throw apiErrors.badRequest("Please paste some text first.");
  return text;
}

function requireUrl(url?: string): string {
  if (!url?.trim()) throw apiErrors.badRequest("Please enter a URL first.");
  return url;
}

function extractionError(error: unknown): ApiError {
  // Extractors deliberately return a few actionable messages (for example,
  // a password-protected PDF). Keep those while not leaking provider internals.
  const message = error instanceof Error ? error.message : "Extraction failed.";
  const safe = /password-protected|couldn't open|failed to read|no readable text|try pasting|try again/i.test(message);
  return new ApiError(422, "import_analysis_failed", safe ? message : "Couldn't analyze this source. Try again or paste the text instead.");
}

