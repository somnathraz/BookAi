import "server-only";

import {
  canGenerate,
  FREE_SITE_LIMIT,
  getPlan,
  planLimit,
  siteCount,
} from "@/lib/accounts";

export type SessionResult =
  | { readonly verified: false }
  | {
      readonly verified: true;
      readonly email: string;
      readonly used: number;
      readonly limit: number;
      readonly canCreate: boolean;
      readonly limitReason: string | undefined;
      readonly plan: "free" | "basic";
      readonly freeLimit: number;
    };

export async function getSessionSummary(
  email: string | undefined,
  ip: string | undefined
): Promise<SessionResult> {
  if (!email) return { verified: false };

  const [used, plan, gate] = await Promise.all([
    siteCount(email),
    getPlan(email),
    canGenerate(email, ip),
  ]);

  return {
    verified: true,
    email,
    used,
    limit: planLimit(plan),
    canCreate: gate.ok,
    limitReason: gate.ok ? undefined : gate.reason,
    plan,
    freeLimit: FREE_SITE_LIMIT,
  };
}
