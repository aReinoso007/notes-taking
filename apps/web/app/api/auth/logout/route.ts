import { NextResponse } from "next/server";

import { clearAuthCookies, getAccessToken, getRefreshToken } from "@/lib/server-cookies";
import { getDjangoBaseUrl } from "@/lib/django-proxy";

export async function POST() {
  const refresh = await getRefreshToken();
  const access = await getAccessToken();

  if (refresh && access) {
    await fetch(`${getDjangoBaseUrl()}/api/v1/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access}`,
      },
      body: JSON.stringify({ refresh }),
    }).catch(() => undefined);
  }

  await clearAuthCookies();
  return new NextResponse(null, { status: 204 });
}
