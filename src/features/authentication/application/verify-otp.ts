import "server-only";

import { isValidEmail, normalizeEmail, verifyOtp } from "@/lib/otp";
import { makeToken } from "@/lib/session";
import { apiErrors, ApiError } from "@/platform/http/api-error";

const MESSAGES: Record<string, string> = {
  invalid: "That code isn't right. Try again.",
  expired: "That code expired. Request a new one.",
  too_many: "Too many attempts. Request a new code.",
};

export async function verifyOtpCode(input: {
  email?: string;
  code?: string;
}): Promise<{ email: string; sessionToken: string }> {
  const email = normalizeEmail(input.email ?? "");
  if (!isValidEmail(email) || !input.code?.trim()) {
    throw apiErrors.badRequest("Enter the 6-digit code.");
  }

  const result = await verifyOtp(email, input.code);
  if (result !== "ok") {
    throw new ApiError(400, "otp_verification_failed", MESSAGES[result] ?? "Verification failed.");
  }
  return { email, sessionToken: makeToken(email) };
}

