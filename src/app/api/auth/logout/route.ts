import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/session-cookie";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const POST = createApiRoute("auth.logout", async () => {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
});
