import { NextResponse } from "next/server";

import {
  deleteOwnedSite,
  listOwnedSites,
} from "@/features/site-management/application/manage-sites";
import { apiErrors } from "@/platform/http/api-error";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const GET = createApiRoute("site.list", async (_request, context) => {
  const result = await listOwnedSites(context.email!);
  return NextResponse.json({ email: context.email, ...result });
});

export const DELETE = createApiRoute("site.delete", async (request, context) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) throw apiErrors.badRequest("Missing site id.");
  const deleted = await deleteOwnedSite(context.email!, id);
  return NextResponse.json({ ok: true, deleted });
});
