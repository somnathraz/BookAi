import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/platform/config/env";

const COOKIE_NAME = "bookai_verified";
const DEFAULT_SESSION_DAYS = 30;

/** Verified-session lifetime in seconds (default 30 days). Override with BOOKAI_SESSION_DAYS. */
export function sessionMaxAgeS(): number {
  return 60 * 60 * 24 * (env.sessionDays ?? DEFAULT_SESSION_DAYS);
}

export { COOKIE_NAME };

function secret(): string {
  return (
    env.sessionSecret || env.smtpPassword ||
    "bookai-dev-secret"
  );
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function makeToken(email: string): string {
  const payload = Buffer.from(email.toLowerCase()).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  try {
    if (
      sig.length !== expected.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return null;
    }
  } catch {
    return null;
  }
  return Buffer.from(payload, "base64url").toString("utf8");
}

export function emailFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const token = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  return readToken(token);
}

export function emailFromRequest(request: Request): string | null {
  return emailFromCookieHeader(request.headers.get("cookie"));
}
