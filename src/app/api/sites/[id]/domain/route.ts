import { NextResponse } from "next/server";

import {
  getOwnedCustomDomain,
  updateOwnedCustomDomain,
  verifyOwnedCustomDomain,
} from "@/features/site-management/application/manage-custom-domain";
import { apiErrors } from "@/platform/http/api-error";
import { createApiRouteWithParams } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const GET = createApiRouteWithParams<{ id: string }>("site.domain.read", async (_request, context, params) =>
  NextResponse.json(await getOwnedCustomDomain(context.email!, params.id))
);

export const PATCH = createApiRouteWithParams<{ id: string }>("site.domain.update", async (request, context, params) => {
  let body: { domain?: string; clear?: boolean };
  try {
    body = (await request.json()) as { domain?: string; clear?: boolean };
  } catch {
    throw apiErrors.badRequest("Invalid JSON body.");
  }
  return NextResponse.json(await updateOwnedCustomDomain(context.email!, params.id, body));
});

export const POST = createApiRouteWithParams<{ id: string }>("site.domain.verify", async (_request, context, params) =>
  NextResponse.json(await verifyOwnedCustomDomain(context.email!, params.id))
);
