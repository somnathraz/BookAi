import { NextResponse } from "next/server";

import { COOKIE_NAME, sessionMaxAgeS } from "@/lib/session";
import { env } from "@/platform/config/env";

export const runtime = "nodejs";

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.isProduction,
    path: "/",
  };
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, "", { ...sessionCookieOptions(), maxAge: 0 });
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(COOKIE_NAME, token, { ...sessionCookieOptions(), maxAge: sessionMaxAgeS() });
}
