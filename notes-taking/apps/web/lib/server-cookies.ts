import { cookies } from "next/headers";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "./auth-cookies";

export async function getAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value;
}

export async function setAuthCookies(access: string, refresh: string): Promise<void> {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, access, accessCookieOptions());
  jar.set(REFRESH_COOKIE, refresh, refreshCookieOptions());
}

export async function clearAuthCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}
