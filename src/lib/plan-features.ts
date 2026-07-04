import type { Plan } from "@/lib/accounts";

/** Connect a custom domain — Basic; free when CUSTOM_DOMAIN_ALLOW_FREE=true. */
export function customDomainAllowed(plan: Plan): boolean {
  if (plan === "basic") return true;
  return process.env.CUSTOM_DOMAIN_ALLOW_FREE === "true";
}

/** Hide "Built with PaperChai" on published sites — Basic; free when BRANDING_ALLOW_FREE=true. */
export function brandingRemovalAllowed(plan: Plan): boolean {
  if (plan === "basic") return true;
  return process.env.BRANDING_ALLOW_FREE === "true";
}
