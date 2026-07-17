"use client";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
    public readonly requestId: string | undefined
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

interface ApiRequestOptions extends Omit<RequestInit, "body" | "method" | "headers"> {
  body?: unknown;
  headers?: HeadersInit;
  timeoutMs?: number;
}

async function request<T>(method: string, path: string, options: ApiRequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);
  const headers = new Headers(options.headers);
  const requestId = crypto.randomUUID();
  headers.set("x-request-id", requestId);

  let body: BodyInit | undefined;
  if (options.body instanceof FormData || options.body instanceof URLSearchParams) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(path, {
      ...options,
      method,
      headers,
      body,
      signal: options.signal ?? controller.signal,
    });
    const payload = await parseResponse(response);
    if (!response.ok) {
      const record = isRecord(payload) ? payload : {};
      throw new ApiClientError(
        response.status,
        asString(record.code),
        asString(record.error) ?? asString(record.detail) ?? "Request failed.",
        asString(record.requestId) ?? response.headers.get("x-request-id") ?? undefined
      );
    }
    return payload as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json") || contentType.includes("application/problem+json")) {
    return response.json().catch(() => ({}));
  }
  return response.text();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<ApiRequestOptions, "body">) => request<T>("GET", path, options),
  post: <T>(path: string, options?: ApiRequestOptions) => request<T>("POST", path, options),
  patch: <T>(path: string, options?: ApiRequestOptions) => request<T>("PATCH", path, options),
  delete: <T>(path: string, options?: ApiRequestOptions) => request<T>("DELETE", path, options),
};

