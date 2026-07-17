import "server-only";

import { timingSafeEqual } from "crypto";

import { env } from "@/platform/config/env";

export type CronCredential = "billing-reminders" | "lifecycle-reminders";

export function isAuthorizedCronRequest(request: Request, credential: CronCredential): boolean {
  const secret =
    credential === "billing-reminders"
      ? env.billingReminderSecret ?? env.cronSecret
      : env.lifecycleEmailSecret ?? env.cronSecret;
  if (!secret) return true;

  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (supplied.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(secret));
}
