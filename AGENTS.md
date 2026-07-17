# BookAi Engineering Contract

This file is mandatory for every human or AI contribution. Follow it before
adding a feature, changing an API, or restructuring code. If an existing area
does not comply, improve it through a safe, incremental migration; do not copy
the old pattern into new code.

## Non-negotiable architecture rules

1. **One mandatory platform entry point per cross-cutting concern.**
   API handlers use the route factory; browser requests use the API client;
   configuration uses the config module; persistence uses repositories and the
   database manager; logging uses the platform logger.
2. **One source of truth is a registry, not a giant manager file.**
   Add endpoint, error-code, permission, rate-limit, feature-flag, template,
   provider, job, event, audit, cache, and idempotency definitions only to
   their corresponding central registry.
3. **Feature code owns business rules; the platform owns infrastructure.**
   API routes are thin adapters. React components render and collect input;
   they do not contain authorization, database, network, or business logic.
4. **Do not duplicate a cross-cutting concern.**
   Never add per-route authentication, error formatting, rate limiting,
   logging, environment reads, database connections, or ad-hoc `fetch` calls.
5. **Prefer a small, complete vertical slice over a broad partial rewrite.**
   Preserve existing contracts during migration unless an explicit versioned
   API change is approved.

## Mandatory request lifecycle

All API endpoints must enter through `createApiRoute` and follow this order:

```text
request ID/context → security policy → authentication → ownership/permission
→ rate limit → idempotency when needed → body limit → schema validation
→ feature flag → controller → service → repository/transaction
→ audit/domain event → response validation → error translation → log/metrics
```

Physical Next.js `route.ts` files stay small. The central endpoint registry
owns endpoint ID, method, path, version, access, permission, request/response
schema, rate-limit policy, idempotency policy, feature flag, body limit, and
timeout.

## Server and API rules

- API error responses use RFC 9457 Problem Details once an endpoint has been
  migrated. Error codes are stable public contracts and are registered.
- Validate all external input at the boundary. Internal services receive typed,
  trusted data only.
- Never return stack traces, SQL/provider errors, credentials, or sensitive
  operational information to clients.
- Every private operation must enforce authentication and resource ownership.
- All retryable mutations must have an idempotency strategy before release.
- Long-running work belongs in the job system, not an API request.
- New browser-side requests use the API client; React components do not call
  `fetch` directly.

## Persistence and configuration rules

- Database access belongs to a repository. API routes and React components may
  not issue queries or create connections.
- Multi-step writes go through the transaction manager.
- Production schema changes use forward-only, versioned migrations. Do not add
  hidden schema mutations to feature requests.
- `process.env` is permitted only in the platform config module.
- Secrets are never logged, returned, stored in client state, or placed in
  browser-visible environment variables.
- Store timestamps in UTC and exchange date/time values as ISO 8601 strings.

## Security, logging, and operations

- Default to deny. Use central permissions and policies, never scattered role
  comparisons.
- Apply request limits, rate limits, secure cookies, CSRF/CORS rules, security
  headers, SSRF-safe URL handling, and timing-safe secret comparison through
  platform controls.
- Use the structured logger only. Do not add `console.log`, `console.warn`, or
  `console.error` in application code.
- Logs require safe metadata only: request/trace ID, operation, feature,
  duration, result, and registered error code. Redact tokens, cookies, API
  keys, database URLs, résumé content, booking content, and PII.
- Logs, audit records, and domain events are distinct systems. Do not use one
  as a substitute for another.

## Frontend, templates, and state

- Theme values come from global semantic tokens and template presets. Do not
  hardcode feature-level colours, spacing, type scales, shadows, or motion
  timing when a token exists.
- Resume layouts are selected only through the template registry. Do not scatter
  career-stage/template conditionals across unrelated components.
- Use the correct state owner: server data on the server/query cache; URL state
  in URL parameters; form state in the form layer; tiny local interaction in
  `useState`; cross-page UI state in a dedicated store. Never put database
  entities into a global UI store.
- Every meaningful UI flow has loading, empty, error, retry, and accessible
  keyboard/focus states.

## Quality gates

Before handoff, run the smallest relevant checks plus typecheck. New or changed
work must include the appropriate unit, integration, contract, security, or UI
test. CI ultimately enforces typecheck, lint, tests, build, dependency/security
scan, and accessibility checks.

Use strict TypeScript. Avoid `any`, unhandled promises, circular dependencies,
cross-feature internal imports, dead code, giant files, and generic `utils.ts`
dumping grounds. Prefer one concept per file with clear names such as
`*.service.ts`, `*.repository.ts`, `*.schema.ts`, `*.mapper.ts`, and
`*.policy.ts`.

## Delivery and decisions

- Use small, focused feature branches and Conventional Commits.
- Write an ADR before introducing a consequential dependency, persistence
  strategy, external provider, public API version, authentication model, or
  background-job system.
- A pull request must describe API/data/security impact, test coverage, rollout
  and rollback behaviour, and screenshots for visible UI changes.
- Build only what BookAi currently needs. Keep workspace RBAC, encrypted
  credential vaults, distributed queues, Redis, and advanced event/outbox
  infrastructure behind explicit product requirements and ADRs.
