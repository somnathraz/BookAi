import { NextResponse } from "next/server";

import {
  canGenerate,
  FREE_SITE_LIMIT,
  planLimit,
  siteCount,
  getPlan,
} from "@/lib/accounts";
import { ipFromRequest } from "@/lib/abuse";
import { emailFromRequest } from "@/lib/session";

export const runtime = "nodejs";

/** Returns the verified email and whether another site can be created. */
export async function GET(request: Request) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ verified: false }, { status: 401 });
  }

  const ip = ipFromRequest(request);
  const used = await siteCount(email);
  const plan = await getPlan(email);
  const limit = planLimit(plan);
  const gate = await canGenerate(email, ip);

  return NextResponse.json({
    verified: true,
    email,
    used,
    limit,
    canCreate: gate.ok,
    limitReason: gate.ok ? undefined : gate.reason,
    // backwards compat for dashboard
    plan,
    freeLimit: FREE_SITE_LIMIT,
  });
}
