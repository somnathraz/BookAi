import "server-only";

import {
  aiAvailable,
  emailAvailable,
  getActiveProviderId,
  googleAvailable,
  listConfiguredProviders,
} from "@/lib/ai/provider";
import { businessSearchAvailable } from "@/lib/business-search";
import { dbEnabled } from "@/lib/db";

export function getApplicationCapabilities() {
  return {
    ai: aiAvailable(),
    provider: getActiveProviderId(),
    providers: listConfiguredProviders(),
    google: googleAvailable(),
    businessSearch: businessSearchAvailable(),
    email: emailAvailable(),
    db: dbEnabled(),
  };
}
