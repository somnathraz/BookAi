import "server-only";

import { hasEmailTransport, sendOtp } from "@/lib/email";
import { createOtp, isValidEmail, normalizeEmail } from "@/lib/otp";
import { env } from "@/platform/config/env";
import { apiErrors, ApiError } from "@/platform/http/api-error";

export interface RequestOtpResult {
  delivered: boolean;
  /** Available only in local development with no email transport. */
  devCode?: string;
}

export async function requestOtp(rawEmail: string | undefined): Promise<RequestOtpResult> {
  const email = normalizeEmail(rawEmail ?? "");
  if (!isValidEmail(email)) throw apiErrors.badRequest("Enter a valid email address.");

  const code = await createOtp(email);
  if (!code) {
    throw new ApiError(429, "otp_recently_sent", "A code was just sent — check your inbox or wait a moment.");
  }

  try {
    await sendOtp(email, code);
  } catch {
    throw new ApiError(502, "otp_delivery_failed", "Couldn't send the email. Try again.");
  }

  const delivered = hasEmailTransport();
  return {
    delivered,
    devCode: !delivered && !env.isProduction ? code : undefined,
  };
}

