import { NextResponse } from "next/server";

import { ipFromRequest } from "@/lib/abuse";
import {
  analyzeSource,
  analyzeUpload,
  assertImportAvailable,
} from "@/features/smart-import/application/analyze-source";
import { apiErrors } from "@/platform/http/api-error";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = createApiRoute("resume.extract", async (request, context) => {
  // Don't burn SerpAPI / AI keys if this account (or IP) can't publish another site.
  const ip = ipFromRequest(request);
  await assertImportAvailable(context.email, ip);

  const contentType = request.headers.get("content-type") ?? "";

  // Resume PDF / file upload comes as multipart.
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw apiErrors.badRequest("No file uploaded.");
    return NextResponse.json({ analysis: await analyzeUpload(file) });
  }

  let body: { source?: string; text?: string; url?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    throw apiErrors.badRequest("Invalid JSON body.");
  }
  return NextResponse.json({ analysis: await analyzeSource(body) });
});
