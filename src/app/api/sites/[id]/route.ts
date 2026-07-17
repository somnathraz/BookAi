import { NextResponse } from "next/server";

import { getOwnedSite } from "@/features/site-management/application/manage-sites";
import { createApiRouteWithParams } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const GET = createApiRouteWithParams<{ id: string }>(
  "site.read",
  async (_request, context, { id }) => NextResponse.json(await getOwnedSite(context.email!, id))
);
