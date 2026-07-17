import "server-only";

import { dbEnabled, ensureSchema, getSql } from "@/lib/db";

/**
 * Server-side database boundary. New repositories import from here; the
 * existing lib/db implementation remains the single connection pool until it
 * is migrated without risking production data access.
 */
export const database = {
  client: getSql,
  isEnabled: dbEnabled,
  ensureSchema,
};
