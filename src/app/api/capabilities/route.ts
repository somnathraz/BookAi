import { NextResponse } from "next/server";

import {
  aiAvailable,
  emailAvailable,
  googleAvailable,
  getActiveProviderId,
  listConfiguredProviders,
} from "@/lib/ai/provider";
import { dbEnabled } from "@/lib/db";

export async function GET() {
  return NextResponse.json({
    ai: aiAvailable(),
    provider: getActiveProviderId(),
    providers: listConfiguredProviders(),
    google: googleAvailable(),
    email: emailAvailable(),
    // Persistent OTP/site storage. MUST be true in production — without it the
    // OTP code lives in memory and won't validate across serverless instances.
    db: dbEnabled(),
  });
}
