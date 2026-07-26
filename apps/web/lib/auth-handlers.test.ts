import { beforeEach, describe, expect, it, vi } from "vitest";

const setAuthCookies = vi.fn();
const clearAuthCookies = vi.fn();

vi.mock("@/lib/server-cookies", () => ({
  setAuthCookies: (...args: unknown[]) => setAuthCookies(...args),
  clearAuthCookies: (...args: unknown[]) => clearAuthCookies(...args),
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
}));

import { handleLogin, handleSignup } from "./auth-handlers";

describe("auth handlers cookie set", () => {
  beforeEach(() => {
    setAuthCookies.mockReset();
    clearAuthCookies.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("signup sets httpOnly cookies and returns only the user", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: { id: 1, email: "new@example.com" },
          access: "access-token",
          refresh: "refresh-token",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    const res = await handleSignup(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: "new@example.com",
          password: "securepass1",
        }),
      }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      user: { id: 1, email: "new@example.com" },
    });
    expect(setAuthCookies).toHaveBeenCalledWith("access-token", "refresh-token");
  });

  it("login sets cookies on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: { id: 2, email: "a@example.com" },
          access: "a",
          refresh: "r",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const res = await handleLogin(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "a@example.com", password: "pass-12345" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(setAuthCookies).toHaveBeenCalledWith("a", "r");
  });

  it("login does not set cookies on failure", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Invalid" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await handleLogin(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "a@example.com", password: "wrong" }),
      }),
    );

    expect(res.status).toBe(400);
    expect(setAuthCookies).not.toHaveBeenCalled();
  });
});
