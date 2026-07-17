import { NextResponse } from "next/server";

import { ipFromRequest } from "@/lib/abuse";
import { generateAndStoreSite } from "@/features/site-generation/application/generate-site";
import { apiErrors } from "@/platform/http/api-error";
import { createApiRoute } from "@/platform/http/create-api-route";
import type { GeneratorInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type GenerateBody = GeneratorInput & { siteId?: string };

export const POST = createApiRoute("resume.generate", async (request, context) => {
  const ip = ipFromRequest(request);

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    throw apiErrors.badRequest("Invalid JSON body.");
  }

  const siteId = body.siteId?.trim() || undefined;
  const isUpdate = Boolean(siteId);

  if (!body?.name?.trim()) {
    throw apiErrors.badRequest("A name or business name is required.");
  }

  const normalized: GeneratorInput = {
    ...body,
    domain: body.domain ?? "other",
    theme: body.theme ?? "light",
  };

  const result = await generateAndStoreSite({
    email: context.email!,
    ip,
    siteId: isUpdate ? siteId : undefined,
    input: normalized,
    host: request.headers.get("host") ?? undefined,
  });
  return NextResponse.json(result);
});
