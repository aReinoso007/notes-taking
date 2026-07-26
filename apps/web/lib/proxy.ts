import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
} from "./server-cookies";
import { djangoFetch, type TokenStore } from "./django-proxy";

export function cookieTokenStore(): TokenStore {
  return {
    getAccess: getAccessToken,
    getRefresh: getRefreshToken,
    setTokens: setAuthCookies,
    clearTokens: clearAuthCookies,
  };
}

export async function proxyToDjango(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const { response } = await djangoFetch(path, init, cookieTokenStore());

  const body = await response.text();
  const headers = new Headers();
  const contentType = response.headers.get("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  return new Response(body || null, {
    status: response.status,
    headers,
  });
}
