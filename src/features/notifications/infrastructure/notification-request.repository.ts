import "server-only";

import { ensureSchema, getSql } from "@/lib/db";

const memoryRequests = new Map<string, Set<string>>();

export async function saveNotificationRequest(
  source: string,
  email: string | null,
  ip: string | undefined
): Promise<void> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    if (email) {
      await sql`
        insert into notify_requests (source, email, ip)
        values (${source}, ${email}, ${ip ?? null})
        on conflict (source, email) where email is not null do nothing`;
      return;
    }
    await sql`
      insert into notify_requests (source, email, ip)
      values (${source}, ${null}, ${ip ?? null})`;
    return;
  }

  const entries = memoryRequests.get(source) ?? new Set<string>();
  entries.add(email ?? `ip:${ip ?? "unknown"}:${Date.now()}`);
  memoryRequests.set(source, entries);
}
