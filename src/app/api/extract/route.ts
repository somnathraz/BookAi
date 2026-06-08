import { NextResponse } from "next/server";

import { canGenerate, FREE_SITES_PER_IP, ipSiteCount } from "@/lib/accounts";
import { ipFromRequest } from "@/lib/abuse";
import { enforceRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { extractFromResumeText, extractFromPdf } from "@/lib/extract/resume";
import { extractFromLinkedInText } from "@/lib/extract/linkedin";
import { extractFromUrl } from "@/lib/extract/competitor";
import { extractFromGoogleMaps } from "@/lib/extract/maps";
import { emailFromRequest } from "@/lib/session";
import type { AnalysisResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "extract");
  if (!limited.allowed) return rateLimitResponse(limited);

  // Don't burn SerpAPI / AI keys if this account (or IP) can't publish another site.
  const email = emailFromRequest(request);
  const ip = ipFromRequest(request);
  if (email) {
    const gate = await canGenerate(email, ip);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.reason, code: "limit_reached" },
        { status: 402 }
      );
    }
  } else if (ip && (await ipSiteCount(ip)) >= FREE_SITES_PER_IP) {
    return NextResponse.json(
      {
        error:
          "You've reached the free limit for this network. Verify your email or upgrade to Pro for more.",
        code: "limit_reached",
      },
      { status: 402 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    // Resume PDF / file upload comes as multipart.
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
      }

      // Guard against large files BEFORE reading into memory.
      // Vercel hard-rejects payloads > 4.5 MB anyway, but this gives a clear message.
      const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          {
            error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). ` +
              "Please upload a PDF under 5 MB, or paste the text instead.",
          },
          { status: 413 }
        );
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      let analysis: AnalysisResult;
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        analysis = await extractFromPdf(bytes);
      } else {
        analysis = await extractFromResumeText(new TextDecoder().decode(bytes));
      }
      return NextResponse.json({ analysis });
    }

    const body = (await request.json()) as { source?: string; text?: string; url?: string };
    const source = body.source;

    let analysis: AnalysisResult;
    switch (source) {
      case "resume":
        analysis = await extractFromResumeText(requireText(body.text));
        break;
      case "linkedin":
        analysis = await extractFromLinkedInText(requireText(body.text));
        break;
      case "competitor":
        analysis = await extractFromUrl(requireUrl(body.url));
        break;
      case "maps":
        analysis = await extractFromGoogleMaps(requireUrl(body.url));
        break;
      default:
        return NextResponse.json({ error: "Unknown source." }, { status: 400 });
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

function requireText(text?: string): string {
  if (!text || !text.trim()) throw new Error("Please paste some text first.");
  return text;
}

function requireUrl(url?: string): string {
  if (!url || !url.trim()) throw new Error("Please enter a URL first.");
  return url;
}
