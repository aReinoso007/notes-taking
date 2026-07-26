import { describe, expect, it, vi } from "vitest";

import { djangoFetch, type TokenStore } from "./django-proxy";

function memoryStore(initial?: {
  access?: string;
  refresh?: string;
}): TokenStore & { access?: string; refresh?: string } {
  const store: TokenStore & { access?: string; refresh?: string } = {
    access: initial?.access,
    refresh: initial?.refresh,
    getAccess: async () => store.access,
    getRefresh: async () => store.refresh,
    setTokens: async (access, refresh) => {
      store.access = access;
      store.refresh = refresh;
    },
    clearTokens: async () => {
      store.access = undefined;
      store.refresh = undefined;
    },
  };
  return store;
}

describe("djangoFetch silent refresh", () => {
  it("retries once after a successful refresh on 401", async () => {
    const store = memoryStore({ access: "old-access", refresh: "old-refresh" });
    const fetchImpl = vi
      .fn()
      // first resource call — expired
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      // refresh
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access: "new-access", refresh: "new-refresh" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      // retry
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: { id: 1, email: "a@x.com" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await djangoFetch(
      "/auth/me/",
      { method: "GET" },
      store,
      fetchImpl,
      "http://django.test",
    );

    expect(result.refreshed).toBe(true);
    expect(result.response.status).toBe(200);
    expect(store.access).toBe("new-access");
    expect(store.refresh).toBe("new-refresh");
    expect(fetchImpl).toHaveBeenCalledTimes(3);

    const retryHeaders = new Headers(fetchImpl.mock.calls[2][1].headers);
    expect(retryHeaders.get("Authorization")).toBe("Bearer new-access");
  });

  it("clears tokens and does not retry when refresh fails", async () => {
    const store = memoryStore({ access: "old-access", refresh: "old-refresh" });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(new Response("{}", { status: 401 }));

    const result = await djangoFetch(
      "/auth/me/",
      { method: "GET" },
      store,
      fetchImpl,
      "http://django.test",
    );

    expect(result.refreshed).toBe(false);
    expect(result.response.status).toBe(401);
    expect(store.access).toBeUndefined();
    expect(store.refresh).toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not refresh when there is no refresh cookie", async () => {
    const store = memoryStore({ access: "old-access" });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 401 }));

    const result = await djangoFetch(
      "/notes/",
      { method: "GET" },
      store,
      fetchImpl,
      "http://django.test",
    );

    expect(result.refreshed).toBe(false);
    expect(store.access).toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("passes through successful responses without refreshing", async () => {
    const store = memoryStore({ access: "ok", refresh: "r" });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));

    const result = await djangoFetch(
      "/categories/",
      { method: "GET" },
      store,
      fetchImpl,
      "http://django.test",
    );

    expect(result.refreshed).toBe(false);
    expect(result.response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
