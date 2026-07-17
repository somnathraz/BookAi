import { NextResponse } from "next/server";

import { getApplicationCapabilities } from "@/features/application-status/application/get-capabilities";
import { createApiRoute } from "@/platform/http/create-api-route";

export const GET = createApiRoute("system.capabilities", async () =>
  NextResponse.json(getApplicationCapabilities())
);
