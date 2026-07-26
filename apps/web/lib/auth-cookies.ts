export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

/** Access ~15 min; refresh ~7 days — matches SimpleJWT settings. */
export const ACCESS_MAX_AGE = 60 * 15;
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

export type CookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
};

export function authCookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function accessCookieOptions(): CookieOptions {
  return authCookieOptions(ACCESS_MAX_AGE);
}

export function refreshCookieOptions(): CookieOptions {
  return authCookieOptions(REFRESH_MAX_AGE);
}
