# ADR 0001: Platform request pipeline

- Status: Accepted
- Date: 2026-07-17

## Context

BookAi's API routes historically combined authentication, rate limiting, input
parsing, response formatting, logging, business logic, and persistence in one
file. This made behaviour inconsistent and expensive to change safely.

## Decision

All new API endpoints and all migrated endpoints use the platform endpoint
registry and `createApiRoute` request factory.

The factory owns request ID/context, method and body-size policy, session-based
authentication, rate limiting, safe error translation, response request IDs,
and structured completion/failure logs. Route files parse transport input and
delegate business work to application services.

Endpoint metadata belongs in `src/platform/api/endpoint-registry.ts`. New
cross-cutting controls are added to the factory/policy model, never copied into
individual routes.

## Compatibility

The application is migrated endpoint by endpoint. Existing successful response
bodies remain unchanged until an explicitly versioned client migration. Error
responses expose RFC 9457-compatible fields while retaining the legacy string
`error` field during the transition.

## Consequences

- New route code is smaller and receives common safety behaviour automatically.
- Existing endpoints cannot be considered fully migrated until they use the
  registry and route factory.
- Authentication policies based on submitted credentials, idempotency storage,
  request schemas, and distributed rate limits are subsequent platform slices;
  routes must not invent one-off versions in the meantime.
