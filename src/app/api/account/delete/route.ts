import { NextResponse } from "next/server";

import { deleteAccount } from "@/features/account/application/delete-account";
import { clearSessionCookie } from "@/lib/session-cookie";
import { apiErrors } from "@/platform/http/api-error";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const POST = createApiRoute("account.delete", async (request, context) => {
  let body: { confirmEmail?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    throw apiErrors.badRequest("Invalid JSON body.");
  }

  const summary = await deleteAccount(context.email!, body.confirmEmail);
  const res = NextResponse.json({ ok: true, deleted: summary });
  clearSessionCookie(res);
  return res;
});
