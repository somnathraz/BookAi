import "server-only";

// Per-IP rate limiting to resist OTP/abuse. In-memory sliding window — move to
// Redis/Supabase for multi-instance production.

const OTP_WINDOW_MS = 15 * 60 * 1000;
const OTP_MAX_PER_WINDOW = 6;

const otpHits = new Map<string, number[]>();

export function ipFromRequest(request: Request): string | undefined {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || undefined;
}

// Returns true if allowed, false if the IP is over its OTP request budget.
export function allowOtpRequest(ip?: string): boolean {
  if (!ip) return true; // can't identify (e.g. local dev) — don't block
  const now = Date.now();
  const hits = (otpHits.get(ip) ?? []).filter((t) => now - t < OTP_WINDOW_MS);
  if (hits.length >= OTP_MAX_PER_WINDOW) {
    otpHits.set(ip, hits);
    return false;
  }
  hits.push(now);
  otpHits.set(ip, hits);
  return true;
}
