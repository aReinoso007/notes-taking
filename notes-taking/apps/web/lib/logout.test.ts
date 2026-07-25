import { beforeEach, describe, expect, it, vi } from "vitest";

const clearAuthCookies = vi.fn();
const getAccessToken = vi.fn();
const getRefreshToken = vi.fn();

vi.mock("@/lib/server-cookies", () => ({
  clearAuthCookies: (...args: unknown[]) => clearAuthCookies(...args),
  getAccessToken: (...args: unknown[]) => getAccessToken(...args),
  getRefreshToken: (...args: unknown[]) => getRefreshToken(...args),
  setAuthCookies: vi.fn(),
}));

import { POST as logout } from "@/app/api/auth/logout/route";

describe("logout clears cookies", () => {
  beforeEach(() => {
    clearAuthCookies.mockReset();
    getAccessToken.mockReset();
    getRefreshToken.mockReset();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  });

  it("clears cookies even when tokens are missing", async () => {
    getAccessToken.mockResolvedValue(undefined);
    getRefreshToken.mockResolvedValue(undefined);

    const res = await logout();
    expect(res.status).toBe(204);
    expect(clearAuthCookies).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("blacklists refresh then clears cookies", async () => {
    getAccessToken.mockResolvedValue("access");
    getRefreshToken.mockResolvedValue("refresh");

    const res = await logout();
    expect(res.status).toBe(204);
    expect(fetch).toHaveBeenCalledOnce();
    expect(clearAuthCookies).toHaveBeenCalledOnce();
  });
});
