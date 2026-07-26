/**
 * Server-side Django proxy with a single silent refresh-and-retry on 401.
 */

export function getDjangoBaseUrl(): string {
  return (
    process.env.API_URL?.replace(/\/$/, "") ||
    process.env.DJANGO_API_URL?.replace(/\/$/, "") ||
    "http://localhost:8001"
  );
}

export type TokenStore = {
  getAccess: () => Promise<string | undefined>;
  getRefresh: () => Promise<string | undefined>;
  setTokens: (access: string, refresh: string) => Promise<void>;
  clearTokens: () => Promise<void>;
};

export type DjangoFetchResult = {
  response: Response;
  /** True when a silent refresh succeeded and the request was retried. */
  refreshed: boolean;
};

type FetchLike = typeof fetch;

/**
 * Call Django under /api/v1. On 401, attempt one refresh using the refresh
 * cookie, update tokens, and retry the original request once.
 */
export async function djangoFetch(
  path: string,
  init: RequestInit = {},
  store: TokenStore,
  fetchImpl: FetchLike = fetch,
  apiBase: string = getDjangoBaseUrl(),
): Promise<DjangoFetchResult> {
  const url = `${apiBase}/api/v1${path.startsWith("/") ? path : `/${path}`}`;

  const doRequest = async (access?: string) => {
    const headers = new Headers(init.headers);
    if (access) {
      headers.set("Authorization", `Bearer ${access}`);
    }
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return fetchImpl(url, { ...init, headers });
  };

  const access = await store.getAccess();
  let response = await doRequest(access);

  if (response.status !== 401) {
    return { response, refreshed: false };
  }

  const refresh = await store.getRefresh();
  if (!refresh) {
    await store.clearTokens();
    return { response, refreshed: false };
  }

  const refreshRes = await fetchImpl(`${apiBase}/api/v1/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!refreshRes.ok) {
    await store.clearTokens();
    return { response, refreshed: false };
  }

  const tokens = (await refreshRes.json()) as {
    access: string;
    refresh?: string;
  };
  const nextRefresh = tokens.refresh ?? refresh;
  await store.setTokens(tokens.access, nextRefresh);

  response = await doRequest(tokens.access);
  return { response, refreshed: true };
}

export async function readDjangoJson<T>(
  result: DjangoFetchResult,
): Promise<{ status: number; data: T | null; raw: string }> {
  const raw = await result.response.text();
  let data: T | null = null;
  if (raw) {
    try {
      data = JSON.parse(raw) as T;
    } catch {
      data = null;
    }
  }
  return { status: result.response.status, data, raw };
}
