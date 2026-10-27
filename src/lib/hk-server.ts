import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Talking to the Heurekka API from the web server. The admin site never
 * handles tokens in the browser: they live in httpOnly cookies, and these
 * route handlers attach them and refresh them.
 */
export const API = process.env.HEUREKKA_API ?? "http://localhost:4000/api/v1";

const AT = "hk_admin_at";
const RT = "hk_admin_rt";
const secure = process.env.NODE_ENV === "production";
const DEVICE = { "x-hk-device": "Admin site" };

type Tokens = { accessToken: string; refreshToken: string };

/** Stores a fresh pair: the access token lasts 15 minutes, the session 12 hours. */
export function setSession(res: NextResponse, t: Tokens) {
  const base = { httpOnly: true, secure, sameSite: "strict" as const, path: "/" };
  res.cookies.set(AT, t.accessToken, { ...base, maxAge: 15 * 60 });
  res.cookies.set(RT, t.refreshToken, { ...base, maxAge: 12 * 60 * 60 });
}

export function clearSession(res: NextResponse) {
  res.cookies.delete(AT);
  res.cookies.delete(RT);
}

const json = (status: number, body: unknown) => NextResponse.json(body, { status });
export const signedOut = () => json(401, { error: { code: "UNAUTHORIZED", message: "Sign in to continue." } });

/** A call with no session, e.g. the sign-in steps. Passes the API's answer straight back. */
export async function forward(path: string, init: RequestInit) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { "content-type": "application/json", ...DEVICE, ...init.headers }, cache: "no-store" });
  return { status: res.status, body: await res.json().catch(() => ({ error: { code: "BAD_GATEWAY", message: "The server didn't answer properly." } })) };
}

/**
 * A call as the signed-in staff member. On an expired access token it
 * refreshes once and retries; if the session has ended, it clears the cookies.
 */
export async function asStaff(path: string, init: RequestInit = {}) {
  const jar = await cookies();
  const at = jar.get(AT)?.value;
  const rt = jar.get(RT)?.value;
  if (!at && !rt) return signedOut();
  const call = (token: string) =>
    fetch(`${API}${path}`, { ...init, headers: { ...(init.body ? { "content-type": "application/json" } : {}), ...DEVICE, authorization: `Bearer ${token}`, ...init.headers }, cache: "no-store" });
  let res = at ? await call(at) : null;
  let fresh: Tokens | null = null;
  if ((!res || res.status === 401) && rt) {
    const r = await fetch(`${API}/auth/refresh`, { method: "POST", headers: { "content-type": "application/json", ...DEVICE }, body: JSON.stringify({ refreshToken: rt }), cache: "no-store" });
    if (r.ok) {
      fresh = (await r.json()) as Tokens;
      res = await call(fresh.accessToken);
    }
  }
  if (!res) {
    const out = signedOut();
    clearSession(out);
    return out;
  }
  const out = new NextResponse(await res.text(), { status: res.status, headers: { "content-type": res.headers.get("content-type") ?? "application/json" } });
  if (fresh) setSession(out, fresh);
  else if (res.status === 401) clearSession(out);
  return out;
}

/** Ends the session on the server and forgets it here. */
export async function endSession() {
  const rt = (await cookies()).get(RT)?.value;
  if (rt) await fetch(`${API}/auth/logout`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refreshToken: rt }), cache: "no-store" }).catch(() => undefined);
  const out = NextResponse.json({ ok: true });
  clearSession(out);
  return out;
}
