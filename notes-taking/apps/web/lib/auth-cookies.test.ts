import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  authCookieOptions,
  refreshCookieOptions,
} from "./auth-cookies";

describe("auth cookies", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses httpOnly, SameSite=Lax, and path /", () => {
    const opts = authCookieOptions(60);
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
    expect(opts.maxAge).toBe(60);
  });

  it("sets Secure only in production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(authCookieOptions(1).secure).toBe(false);

    vi.stubEnv("NODE_ENV", "production");
    expect(authCookieOptions(1).secure).toBe(true);
  });

  it("exposes distinct access and refresh lifetimes", () => {
    expect(ACCESS_COOKIE).toBe("access_token");
    expect(REFRESH_COOKIE).toBe("refresh_token");
    expect(accessCookieOptions().maxAge).toBe(60 * 15);
    expect(refreshCookieOptions().maxAge).toBe(60 * 60 * 24 * 7);
  });
});
