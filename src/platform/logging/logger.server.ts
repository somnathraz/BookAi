import "server-only";

import { getRequestContext } from "@/platform/context/request-context";

type LogContext = Record<string, string | number | boolean | undefined | null>;

const REDACTED_KEYS = new Set([
  "authorization",
  "cookie",
  "apikey",
  "access_token",
  "refreshtoken",
  "clientsecret",
  "databaseurl",
  "password",
  "otp",
  "resume",
  "email",
  "phone",
]);

function redact(context: LogContext): LogContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      REDACTED_KEYS.has(key.replace(/[^a-z]/gi, "").toLowerCase()) ? "[REDACTED]" : value,
    ])
  );
}

function write(level: "info" | "warn" | "error", event: string, context: LogContext = {}): void {
  // JSON keeps logs queryable in Vercel today and portable to a proper log
  // collector later. Callers must only pass safe operational metadata.
  const requestContext = getRequestContext();
  const payload = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    requestId: requestContext?.requestId,
    ...redact(context),
  });
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.info(payload);
}

export const logger = {
  info: (event: string, context?: LogContext) => write("info", event, context),
  warn: (event: string, context?: LogContext) => write("warn", event, context),
  error: (event: string, context?: LogContext) => write("error", event, context),
};
