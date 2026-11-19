"use client";

import { useSyncExternalStore, type ReactNode } from "react";

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
  // The hostname never changes for a page, so there's nothing to subscribe to.
  const allowed = useSyncExternalStore(
    noopSubscribe,
    () => platformHosts().has(window.location.hostname.toLowerCase()),
    () => false
  );

  return allowed ? <>{children}</> : null;
}

function noopSubscribe(): () => void {
  return () => {};
}
