"use client";

import { apiClient } from "@/platform/api/api-client";
import {
  invalidateServerQueries,
  useServerQuery,
} from "@/platform/client-state/server-query-cache";
import { clientQueryKeys } from "@/platform/client-state/query-key-registry";

export interface SessionSummary {
  readonly verified: true;
  readonly email: string;
  readonly used: number;
  readonly limit: number;
  readonly canCreate: boolean;
  readonly limitReason?: string;
  readonly plan: "free" | "basic";
  readonly freeLimit: number;
}

export function useSessionQuery() {
  return useServerQuery<SessionSummary>(
    clientQueryKeys.authentication.session,
    () => apiClient.get<SessionSummary>("/api/auth/session"),
    { staleTimeMs: 60_000 }
  );
}

export function clearAuthenticatedClientData(): void {
  invalidateServerQueries([
    clientQueryKeys.authentication.prefix,
    clientQueryKeys.dashboard.prefix,
    clientQueryKeys.billing.prefix,
    clientQueryKeys.sites.prefix,
  ]);
}
