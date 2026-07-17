import { NextResponse } from "next/server";

import {
  createAccountFeedback,
  listFeedbackForAccount,
} from "@/features/feedback/application/manage-feedback";
import { apiErrors } from "@/platform/http/api-error";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

export const GET = createApiRoute("feedback.list", async (_request, context) =>
  NextResponse.json({ feedback: await listFeedbackForAccount(context.email!) })
);

export const POST = createApiRoute("feedback.create", async (request, context) => {
  let body: {
    siteId?: string;
    rating?: number;
    experience?: string;
    desiredFeatures?: string;
    featureTags?: string[];
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    throw apiErrors.badRequest("Invalid JSON body.");
  }
  const feedback = await createAccountFeedback(context.email!, body);
  return NextResponse.json({ ok: true, feedback });
});
