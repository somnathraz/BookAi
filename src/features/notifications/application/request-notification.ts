import "server-only";

import { saveNotificationRequest } from "@/features/notifications/infrastructure/notification-request.repository";
import { apiErrors } from "@/platform/http/api-error";

const supportedSources = new Set([
  "instagram", "facebook", "youtube", "resume", "website", "notion", "github", "linkedin", "languages",
]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function requestNotification(
  input: { source?: string; email?: string; website?: string },
  context: { email?: string; ip?: string }
) {
  if (input.website?.trim()) return { ok: true };
  const source = input.source?.trim().toLowerCase();
  if (!source || !supportedSources.has(source)) {
    throw apiErrors.badRequest("Unknown source.");
  }
  const email = input.email?.trim().toLowerCase() || context.email?.toLowerCase() || null;
  if (email && !emailPattern.test(email)) {
    throw apiErrors.badRequest("Enter a valid email.");
  }
  await saveNotificationRequest(source, email, context.ip);
  return { ok: true };
}
