import "server-only";

import { NextResponse } from "next/server";

import { RATE_LIMIT_MESSAGE, enforceRateLimit } from "@/lib/rate-limit";
import { ipFromRequest } from "@/lib/abuse";
import { emailFromRequest } from "@/lib/session";
import { logger } from "@/platform/logging/logger.server";
import { ApiError } from "@/platform/http/api-error";
import { apiFailure } from "@/platform/http/api-response";
import { isAuthorizedCronRequest } from "@/platform/security/cron-authorization";
import {
  requestIdFrom,
  runWithRequestContext,
} from "@/platform/context/request-context";
import {
  getEndpointDefinition,
  type ApiRouteId,
} from "@/platform/api/endpoint-registry";

export interface ApiContext {
  requestId: string;
  email?: string;
  ip?: string;
}

export type ApiHandler = (request: Request, context: ApiContext) => Promise<Response>;

/**
 * The only entry point for protected API handlers. It creates request context,
 * enforces the policy registry, returns safe errors, and emits one completion
 * log per request. Legacy response bodies are preserved during migration.
 */
export function createApiRoute(
  routeId: ApiRouteId,
  handler: ApiHandler
): (request: Request) => Promise<Response> {
  const policy = getEndpointDefinition(routeId);

  return async (request) => {
    const requestId = requestIdFrom(request);
    const startedAt = Date.now();
    const email = emailFromRequest(request) ?? undefined;
    const ip = ipFromRequest(request);

    return runWithRequestContext({ requestId, email, startedAt }, async () => {
      try {
        if (request.method !== policy.method) {
          return apiFailure(405, "method_not_allowed", "Method not allowed.", requestId, {
            headers: { Allow: policy.method },
          });
        }

        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (policy.maximumBodyBytes && contentLength > policy.maximumBodyBytes) {
          return apiFailure(
            413,
            "payload_too_large",
            "Request body is too large.",
            requestId
          );
        }

        if (policy.access === "authenticated" && !email) {
          return apiFailure(401, "verify_required", "Email verification required.", requestId);
        }

        if (
          policy.access === "cron" &&
          policy.cronCredential &&
          !isAuthorizedCronRequest(request, policy.cronCredential)
        ) {
          return apiFailure(401, "unauthorized", "Unauthorized.", requestId);
        }

        if (policy.rateLimit) {
          const rateLimitEmail =
            email ?? (await readRateLimitEmail(request, policy.rateLimitEmailField));
          const rateLimitKey = await readRateLimitKey(request, policy.rateLimitKeyField);
          const limited = await enforceRateLimit(request, policy.rateLimit, {
            emailOverride: rateLimitEmail,
            extraBuckets: rateLimitKey ? [`resource:${rateLimitKey}`] : undefined,
          });
          if (!limited.allowed) {
            const retryAfter = limited.retryAfterSec ?? 3600;
            return apiFailure(429, "rate_limited", RATE_LIMIT_MESSAGE, requestId, {
              headers: { "Retry-After": String(retryAfter) },
            });
          }
        }

        const response = await handler(request, { requestId, email, ip });
        response.headers.set("x-request-id", requestId);
        logger.info("api.request.completed", {
          routeId,
          requestId,
          status: response.status,
          durationMs: Date.now() - startedAt,
        });
        return response;
      } catch (error) {
        const known = error instanceof ApiError;
        logger.error("api.request.failed", {
          routeId,
          requestId,
          status: known ? error.status : 500,
          code: known ? error.code : "internal_error",
          durationMs: Date.now() - startedAt,
        });
        return apiFailure(
          known ? error.status : 500,
          known ? error.code : "internal_error",
          known && error.expose ? error.message : "Something went wrong. Please try again.",
          requestId
        );
      }
    });
  };
}

/** Adapts Next.js dynamic route parameters without letting route modules bypass
 * the platform request pipeline. */
export function createApiRouteWithParams<Params>(
  routeId: ApiRouteId,
  handler: (request: Request, context: ApiContext, params: Params) => Promise<Response>
): (
  request: Request,
  context: { params: Promise<Params> }
) => Promise<Response> {
  return async (request, nextContext) => {
    const params = await nextContext.params;
    return createApiRoute(routeId, (innerRequest, context) =>
      handler(innerRequest, context, params)
    )(request);
  };
}

async function readRateLimitEmail(
  request: Request,
  field: string | undefined
): Promise<string | undefined> {
  if (!field || !request.headers.get("content-type")?.includes("application/json")) {
    return undefined;
  }
  try {
    const body = (await request.clone().json()) as Record<string, unknown>;
    const value = body[field];
    return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : undefined;
  } catch {
    return undefined;
  }
}

async function readRateLimitKey(request: Request, field: string | undefined): Promise<string | undefined> {
  if (!field || !request.headers.get("content-type")?.includes("application/json")) {
    return undefined;
  }
  try {
    const body = (await request.clone().json()) as Record<string, unknown>;
    const value = body[field];
    return typeof value === "string" && value.trim() ? value.trim().slice(0, 120) : undefined;
  } catch {
    return undefined;
  }
}

/** Keeps Next route exports ergonomic while the application migrates. */
export function jsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}
