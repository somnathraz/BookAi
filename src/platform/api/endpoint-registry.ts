import type { RateLimitRoute } from "@/lib/rate-limit";
import type { CronCredential } from "@/platform/security/cron-authorization";

export type ApiAccess = "public" | "authenticated" | "cron" | "webhook";
type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface EndpointDefinition {
  method: HttpMethod;
  path: string;
  version: "v1";
  access: ApiAccess;
  rateLimit?: RateLimitRoute;
  /** JSON field used as an additional rate-limit identity, when the caller is
   * not authenticated yet (for example, OTP email verification). */
  rateLimitEmailField?: string;
  /** JSON field that namespaces rate limits by a public resource, such as a
   * published site's slug. */
  rateLimitKeyField?: string;
  permission?: string;
  featureFlag?: string;
  idempotencyRequired?: boolean;
  maximumBodyBytes?: number;
  timeoutMs?: number;
  auditEvent?: string;
  cronCredential?: CronCredential;
}

/**
 * Central registry for every API contract. Routes reference a key rather than
 * reimplementing protection rules. Add a new endpoint policy here first.
 */
export const endpointRegistry = {
  "resume.extract": {
    method: "POST",
    path: "/api/extract",
    version: "v1",
    access: "public",
    rateLimit: "extract",
    maximumBodyBytes: 5 * 1024 * 1024,
    timeoutMs: 60_000,
  },
  "resume.generate": {
    method: "POST",
    path: "/api/generate",
    version: "v1",
    access: "authenticated",
    rateLimit: "generate",
    idempotencyRequired: true,
    timeoutMs: 60_000,
    auditEvent: "site.generated",
  },
  "auth.request-otp": {
    method: "POST",
    path: "/api/auth/request-otp",
    version: "v1",
    access: "public",
    rateLimit: "otp",
    rateLimitEmailField: "email",
  },
  "auth.verify-otp": {
    method: "POST",
    path: "/api/auth/verify-otp",
    version: "v1",
    access: "public",
    rateLimit: "auth",
    rateLimitEmailField: "email",
  },
  "auth.session": {
    method: "GET",
    path: "/api/auth/session",
    version: "v1",
    access: "public",
  },
  "auth.logout": {
    method: "POST",
    path: "/api/auth/logout",
    version: "v1",
    access: "public",
    auditEvent: "auth.session_ended",
  },
  "business-search.query": {
    method: "GET",
    path: "/api/business-search",
    version: "v1",
    access: "public",
    rateLimit: "extract",
  },
  "system.capabilities": {
    method: "GET",
    path: "/api/capabilities",
    version: "v1",
    access: "public",
  },
  "site.booking": {
    method: "POST",
    path: "/api/booking",
    version: "v1",
    access: "public",
    rateLimit: "booking",
    rateLimitKeyField: "slug",
  },
  "public-booking.slots": {
    method: "GET",
    path: "/api/booking/slots",
    version: "v1",
    access: "public",
    rateLimit: "booking",
  },
  "site.list": {
    method: "GET",
    path: "/api/sites",
    version: "v1",
    access: "authenticated",
    permission: "site:list",
  },
  "site.delete": {
    method: "DELETE",
    path: "/api/sites",
    version: "v1",
    access: "authenticated",
    permission: "site:delete",
    auditEvent: "site.deleted",
  },
  "site.read": {
    method: "GET",
    path: "/api/sites/:id",
    version: "v1",
    access: "authenticated",
    permission: "site:read",
  },
  "site.booking.list": {
    method: "GET",
    path: "/api/sites/:id/bookings",
    version: "v1",
    access: "authenticated",
    permission: "booking:read",
  },
  "site.booking.update": {
    method: "PATCH",
    path: "/api/sites/:id/bookings",
    version: "v1",
    access: "authenticated",
    permission: "booking:update",
    auditEvent: "booking.status_updated",
  },
  "site.booking-settings.read": {
    method: "GET",
    path: "/api/sites/:id/booking",
    version: "v1",
    access: "authenticated",
    permission: "booking:manage",
  },
  "site.booking-settings.update": {
    method: "PATCH",
    path: "/api/sites/:id/booking",
    version: "v1",
    access: "authenticated",
    permission: "booking:manage",
    auditEvent: "booking.settings_updated",
  },
  "site.notify": {
    method: "POST",
    path: "/api/notify",
    version: "v1",
    access: "public",
    rateLimit: "notify",
  },
  "site.domain.read": {
    method: "GET",
    path: "/api/sites/:id/domain",
    version: "v1",
    access: "authenticated",
    permission: "site:domain:read",
  },
  "site.domain.update": {
    method: "PATCH",
    path: "/api/sites/:id/domain",
    version: "v1",
    access: "authenticated",
    permission: "site:domain:manage",
    auditEvent: "site.domain_updated",
  },
  "site.domain.verify": {
    method: "POST",
    path: "/api/sites/:id/domain",
    version: "v1",
    access: "authenticated",
    permission: "site:domain:manage",
    auditEvent: "site.domain_verified",
  },
  "site.booking.export": {
    method: "GET",
    path: "/api/sites/:id/bookings/export",
    version: "v1",
    access: "authenticated",
    permission: "booking:export",
  },
  "feedback.list": {
    method: "GET",
    path: "/api/feedback",
    version: "v1",
    access: "authenticated",
    rateLimit: "auth",
  },
  "feedback.create": {
    method: "POST",
    path: "/api/feedback",
    version: "v1",
    access: "authenticated",
    rateLimit: "auth",
    auditEvent: "feedback.created",
  },
  "media.photo": {
    method: "GET",
    path: "/api/photo",
    version: "v1",
    access: "public",
    rateLimit: "proxy",
  },
  "billing.summary": {
    method: "GET",
    path: "/api/billing",
    version: "v1",
    access: "authenticated",
  },
  "billing.checkout": {
    method: "POST",
    path: "/api/billing/checkout",
    version: "v1",
    access: "authenticated",
    auditEvent: "billing.checkout_started",
  },
  "billing.verify": {
    method: "POST",
    path: "/api/billing/verify",
    version: "v1",
    access: "authenticated",
    auditEvent: "billing.checkout_verified",
  },
  "billing.cancel": {
    method: "POST",
    path: "/api/billing/cancel",
    version: "v1",
    access: "authenticated",
    auditEvent: "billing.cancellation_scheduled",
  },
  "media.proxy": {
    method: "GET",
    path: "/api/img",
    version: "v1",
    access: "public",
    rateLimit: "proxy",
  },
  "billing.webhook": {
    method: "POST",
    path: "/api/billing/webhook",
    version: "v1",
    access: "webhook",
  },
  "billing.reminders": {
    method: "POST",
    path: "/api/billing/reminders",
    version: "v1",
    access: "cron",
    cronCredential: "billing-reminders",
  },
  "billing.reminders.read": {
    method: "GET",
    path: "/api/billing/reminders",
    version: "v1",
    access: "cron",
    cronCredential: "billing-reminders",
  },
  "lifecycle.reminders": {
    method: "POST",
    path: "/api/lifecycle/reminders",
    version: "v1",
    access: "cron",
    cronCredential: "lifecycle-reminders",
  },
  "lifecycle.reminders.read": {
    method: "GET",
    path: "/api/lifecycle/reminders",
    version: "v1",
    access: "cron",
    cronCredential: "lifecycle-reminders",
  },
} as const satisfies Record<string, EndpointDefinition>;

export type ApiRouteId = keyof typeof endpointRegistry;

export function getEndpointDefinition(routeId: ApiRouteId): EndpointDefinition {
  return endpointRegistry[routeId];
}
