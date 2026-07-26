import { NextResponse } from "next/server";

import { handleSignup } from "@/lib/auth-handlers";

export async function POST(request: Request) {
  try {
    return await handleSignup(request);
  } catch {
    return NextResponse.json({ detail: "Invalid request." }, { status: 400 });
  }
}
