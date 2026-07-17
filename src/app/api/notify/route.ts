import { NextResponse } from "next/server";

import { requestNotification } from "@/features/notifications/application/request-notification";
import { apiErrors } from "@/platform/http/api-error";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

interface NotifyBody {
  source?: string;
  email?: string;
  /** Honeypot — must be empty. */
  website?: string;
}

export const POST = createApiRoute("site.notify", async (request, context) => {
  let body: NotifyBody;
  try {
    body = (await request.json()) as NotifyBody;
  } catch {
    throw apiErrors.badRequest("Invalid JSON body.");
  }
  return NextResponse.json(await requestNotification(body, context));
});
