import "server-only";

// Client identity helpers. Rate limits live in lib/rate-limit.ts (Postgres-backed).

export function ipFromRequest(request: Request): string | undefined {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || undefined;
}
