import { NextResponse, type NextRequest } from "next/server";

import { getSiteSlugByVerifiedHost } from "@/lib/custom-domain";
import { getSiteRootDomain, subdomainFromHost } from "@/lib/site-url";

// Wildcard subdomain routing: glamzone.paperchaiapp.com → /glamzone
// Custom domains: www.example.com → /glamzone (after DNS + verification)
//
// When NEXT_PUBLIC_SITE_DOMAIN is set, a request to a site subdomain is
// rewritten (not redirected) onto the existing /[slug] route. Verified custom
// domains are resolved the same way. The apex app domain and www pass through.

export async function proxy(req: NextRequest) {
  const root = getSiteRootDomain();
  const host = req.headers.get("host");
  if (!host) return NextResponse.next();

  let slug: string | null = null;
  if (root) {
    slug = subdomainFromHost(host, root);
  }
  if (!slug) {
    slug = await getSiteSlugByVerifiedHost(host);
  }
  if (!slug) return NextResponse.next();

  const url = req.nextUrl.clone();

  if (url.pathname === `/${slug}` || url.pathname.startsWith(`/${slug}/`)) {
    return NextResponse.next();
  }

  const suffix = url.pathname === "/" ? "" : url.pathname;
  url.pathname = `/${slug}${suffix}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
