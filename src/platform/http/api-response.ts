import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, requestId: string, init?: ResponseInit): NextResponse {
  return NextResponse.json(
    { success: true, data, requestId },
    { ...init, headers: { ...init?.headers, "x-request-id": requestId } }
  );
}

export function apiFailure(
  status: number,
  code: string,
  message: string,
  requestId: string,
  init?: ResponseInit
): NextResponse {
  return NextResponse.json(
    {
      // RFC 9457 Problem Details fields. `error` stays as a temporary string
      // alias so migrated routes do not break the existing client contract.
      type: `https://paperchai.app/problems/${code}`,
      title: message,
      status,
      detail: message,
      code,
      requestId,
      success: false,
      error: message,
    },
    {
      ...init,
      status,
      headers: {
        ...init?.headers,
        "Content-Type": "application/problem+json",
        "x-request-id": requestId,
      },
    }
  );
}
