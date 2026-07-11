import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { getCanonicalAppDomain } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Owner-only / private app surfaces
          "/dashboard",
          "/dashboard/",
          "/edit",
          "/edit/",
          // APIs and framework internals
          "/api/",
          "/_next/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getCanonicalAppDomain(),
  };
}
