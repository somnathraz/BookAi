import type { Plan } from "@/lib/accounts";
import { env } from "@/platform/config/env";

/** Connect a custom domain — Basic; free when CUSTOM_DOMAIN_ALLOW_FREE=true. */
export function customDomainAllowed(plan: Plan): boolean {
  if (plan === "basic") return true;
  return env.customDomainAllowFree;
}

/** Hide "Built with PaperChai" on published sites — Basic; free when BRANDING_ALLOW_FREE=true. */
export function brandingRemovalAllowed(plan: Plan): boolean {
  if (plan === "basic") return true;
  return env.brandingAllowFree;
}
