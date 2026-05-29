import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "bookai_verified";
const MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  return (
    process.env.BOOKAI_SECRET?.trim() ||
    process.env.SES_SMTP_PASSWORD?.trim() ||
    process.env.GMAIL_APP_PASSWORD?.trim() ||
    "bookai-dev-secret"
  );
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export { COOKIE_NAME, MAX_AGE_S };

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
