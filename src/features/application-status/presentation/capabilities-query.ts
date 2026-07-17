"use client";

import type { Capabilities } from "@/lib/types";
import { apiClient } from "@/platform/api/api-client";
import { useServerQuery } from "@/platform/client-state/server-query-cache";
import { clientQueryKeys } from "@/platform/client-state/query-key-registry";

export function useCapabilitiesQuery() {
  return useServerQuery<Capabilities>(
    clientQueryKeys.system.capabilities,
    () => apiClient.get<Capabilities>("/api/capabilities"),
    { staleTimeMs: 5 * 60_000 }
  );
}
