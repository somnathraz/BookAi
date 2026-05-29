import { NextResponse } from "next/server";

import { extractFromResumeText, extractFromPdf } from "@/lib/extract/resume";
import { extractFromLinkedInText } from "@/lib/extract/linkedin";
import { extractFromUrl } from "@/lib/extract/competitor";
import { extractFromGoogleMaps } from "@/lib/extract/maps";
import type { AnalysisResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  try {
    // Resume PDF / file upload comes as multipart.
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
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
