import { randomUUID } from "crypto";
import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  requestId: string;
  email?: string;
  startedAt: number;
}

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function requestIdFrom(request: Request): string {
  return request.headers.get("x-request-id")?.slice(0, 120) || randomUUID();
}

export function runWithRequestContext<T>(
  context: RequestContext,
  operation: () => Promise<T>
): Promise<T> {
  return requestContextStorage.run(context, operation);
}

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}
