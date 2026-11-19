import "server-only";

import { getSiteRootDomain } from "@/lib/site-url";
import { env } from "@/platform/config/env";
import { logger } from "@/platform/logging/logger.server";

// Registers each published site's subdomain (<slug>.sites.kritvani.com) on the
// Vercel project so Vercel issues it its own certificate. A wildcard cert
// isn't possible while kritvani.com's DNS lives on Cloudflare, but per-host
// certs work because the *.sites CNAME already points at Vercel.
//
// No-ops unless VERCEL_API_TOKEN, VERCEL_PROJECT_ID and VERCEL_TEAM_ID are set
// and subdomain sites are enabled. Failures are logged, never thrown — a
// missing domain must not block publishing (the path URL still works).

const API = "https://api.vercel.com";
const TIMEOUT_MS = 8_000;

function config() {
  const root = getSiteRootDomain();
  const { vercelApiToken: token, vercelProjectId: project, vercelTeamId: team } = env;
  if (!root || !token || !project || !team) return null;
  return { root, token, project, team };
}

export function siteHostname(slug: string, root: string): string {
  return `${slug}.${root}`;
}

async function call(
  method: "POST" | "DELETE",
  path: string,
  token: string,
  body?: unknown
): Promise<Response> {
  return fetch(`${API}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

/** Attach <slug>.<root> to the Vercel project. Idempotent. */
export async function addSiteDomain(slug: string): Promise<boolean> {
  const c = config();
  if (!c) return false;
  const name = siteHostname(slug, c.root);
  try {
    const res = await call(
      "POST",
      `/v10/projects/${encodeURIComponent(c.project)}/domains?teamId=${encodeURIComponent(c.team)}`,
      c.token,
      { name }
    );
    if (res.ok) return true;
    const err = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
    // Already attached to this project — nothing to do.
    if (res.status === 409 && err?.error?.code === "domain_already_in_use") return true;
    logger.warn("vercel-domains.add.failed", { name, status: res.status, code: err?.error?.code });
    return false;
  } catch (error) {
    logger.warn("vercel-domains.add.error", { name, error: String(error) });
    return false;
  }
}

/** Detach <slug>.<root> from the Vercel project. Missing domains are fine. */
export async function removeSiteDomain(slug: string): Promise<void> {
  const c = config();
  if (!c) return;
  const name = siteHostname(slug, c.root);
  try {
    const res = await call(
      "DELETE",
      `/v9/projects/${encodeURIComponent(c.project)}/domains/${encodeURIComponent(name)}?teamId=${encodeURIComponent(c.team)}`,
      c.token
    );
    if (!res.ok && res.status !== 404) {
      logger.warn("vercel-domains.remove.failed", { name, status: res.status });
    }
  } catch (error) {
    logger.warn("vercel-domains.remove.error", { name, error: String(error) });
  }
}
