import { NextResponse } from "next/server";

import { getSessionSummary } from "@/features/authentication/application/get-session";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

/** Returns the verified email and whether another site can be created. */
export const GET = createApiRoute("auth.session", async (_request, context) => {
  const session = await getSessionSummary(context.email, context.ip);
  return NextResponse.json(session, { status: session.verified ? 200 : 401 });
});
