import { NextResponse } from "next/server";

import { setAuthCookies } from "@/lib/server-cookies";
import { getDjangoBaseUrl } from "@/lib/django-proxy";
import type { User } from "@/lib/types";

type DjangoAuthBody = {
  user: User;
  access: string;
  refresh: string;
};

async function authAgainstDjango(
  path: "/auth/signup/" | "/auth/login/",
  body: unknown,
  successStatus: number,
) {
  const res = await fetch(`${getDjangoBaseUrl()}/api/v1${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: DjangoAuthBody | Record<string, unknown> | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as DjangoAuthBody;
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    return NextResponse.json(data ?? { detail: "Request failed." }, {
      status: res.status,
    });
  }

  const auth = data as DjangoAuthBody;
  await setAuthCookies(auth.access, auth.refresh);
  return NextResponse.json({ user: auth.user }, { status: successStatus });
}

export async function handleSignup(request: Request) {
  const body = await request.json();
  return authAgainstDjango("/auth/signup/", body, 201);
}

export async function handleLogin(request: Request) {
  const body = await request.json();
  return authAgainstDjango("/auth/login/", body, 200);
}
