"use client";

import { useEffect, useState, type ReactNode } from "react";

import { BRAND_DOMAIN } from "@/lib/brand";
import { publicEnv } from "@/platform/config/public-env";

function platformHosts(): Set<string> {
  const hosts = new Set([BRAND_DOMAIN, `www.${BRAND_DOMAIN}`]);
  const app = publicEnv.appUrl?.replace(/^https?:\/\//, "").replace(/[/:].*$/, "");
  if (app) hosts.add(app.toLowerCase());
  return hosts;
}

/**
 * Renders children only on Kritvani's own hosts (builder app + brand page).
 * Customer sites — <slug>.sites.kritvani.com or an owner's custom domain —
 * share this layout, but their visitors must not land in Kritvani's GA or
 * Clarity. Decided client-side so the root layout stays statically renderable.
 */
export function PlatformOnly({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(platformHosts().has(window.location.hostname.toLowerCase()));
  }, []);

  return allowed ? <>{children}</> : null;
}
