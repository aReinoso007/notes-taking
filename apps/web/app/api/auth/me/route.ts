import { NextResponse } from "next/server";

import { proxyToDjango } from "@/lib/proxy";

export async function GET() {
  const response = await proxyToDjango("/auth/me/", { method: "GET" });
  if (response.status === 401) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }
  return response;
}
