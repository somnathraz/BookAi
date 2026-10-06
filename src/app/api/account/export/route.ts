import { NextResponse } from "next/server";

import { exportAccountData } from "@/features/account/application/export-account-data";
import { LEGAL_BRAND_NAME } from "@/lib/legal";
import { createApiRoute } from "@/platform/http/create-api-route";

export const runtime = "nodejs";

function exportFilename(): string {
  const brand = LEGAL_BRAND_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${brand || "account"}-data-export.json`;
}

export const GET = createApiRoute("account.export", async (_request, context) => {
  const payload = await exportAccountData(context.email!);
  const body = JSON.stringify(payload, null, 2);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename()}"`,
      "Cache-Control": "no-store",
    },
  });
});
