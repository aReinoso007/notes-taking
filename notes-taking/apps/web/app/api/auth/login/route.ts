import { NextResponse } from "next/server";

import { handleLogin } from "@/lib/auth-handlers";

export async function POST(request: Request) {
  try {
    return await handleLogin(request);
  } catch {
    return NextResponse.json({ detail: "Invalid request." }, { status: 400 });
  }
}
