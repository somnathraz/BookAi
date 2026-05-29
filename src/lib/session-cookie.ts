import { NextResponse } from "next/server";

import { COOKIE_NAME, MAX_AGE_S } from "@/lib/session";

export const runtime = "nodejs";

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, "", { ...sessionCookieOptions(), maxAge: 0 });
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(COOKIE_NAME, token, { ...sessionCookieOptions(), maxAge: MAX_AGE_S });
}
