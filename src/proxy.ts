import { NextResponse, type NextRequest } from "next/server";

import { getSiteRootDomain, subdomainFromHost } from "@/lib/site-url";

// Wildcard subdomain routing: glamzone.paperchaiapp.com → /glamzone
//
// When NEXT_PUBLIC_SITE_DOMAIN is set, a request to a site subdomain is
// rewritten (not redirected) onto the existing /[slug] route. The apex domain,
// www, and reserved subdomains pass straight through to the app.

export function proxy(req: NextRequest) {
  const root = getSiteRootDomain();
  if (!root) return NextResponse.next();

  const host = req.headers.get("host");
  if (!host) return NextResponse.next();

  const slug = subdomainFromHost(host, root);
  if (!slug) return NextResponse.next();

  const url = req.nextUrl.clone();

  // Avoid rewrite loops if the path is already under the slug.
  if (url.pathname === `/${slug}` || url.pathname.startsWith(`/${slug}/`)) {
    return NextResponse.next();
  }

  const suffix = url.pathname === "/" ? "" : url.pathname;
  url.pathname = `/${slug}${suffix}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip API routes, Next internals, and any file with an extension (assets).
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
