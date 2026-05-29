import { NextResponse } from "next/server";

import {
  aiAvailable,
  emailAvailable,
  googleAvailable,
  getActiveProviderId,
  listConfiguredProviders,
} from "@/lib/ai/provider";

export async function GET() {
  return NextResponse.json({
    ai: aiAvailable(),
    provider: getActiveProviderId(),
    providers: listConfiguredProviders(),
    google: googleAvailable(),
    email: emailAvailable(),
  });
}
