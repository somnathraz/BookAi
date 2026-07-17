import "server-only";

import { APP_DOMAIN, PRODUCT_NAME } from "@/lib/brand";
import { resolveEmailEnv } from "@/lib/ai/provider";
import { env } from "@/platform/config/env";

export const LEGAL_LAST_UPDATED = "July 4, 2026";
export const LEGAL_GOVERNING_LAW = "India";
export const LEGAL_BRAND_NAME = PRODUCT_NAME;
export const LEGAL_REFUND_WINDOW_DAYS = 7;

export function getLegalContactEmail(): string {
  const explicit = env.legalContactEmail;
  if (explicit) return explicit;
  const emailFrom = resolveEmailEnv().from?.trim();
  if (emailFrom) return emailFrom;
  return `support@${APP_DOMAIN}`;
}
