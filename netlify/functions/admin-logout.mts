import type { Config } from "@netlify/functions";
import { clearSessionCookie } from "./_lib/auth.mts";
import { fail, json } from "./_lib/http.mts";

export default (request: Request) => request.method === "POST"
  ? json({ authenticated: false }, 200, { "Set-Cookie": clearSessionCookie() })
  : fail("Method not allowed.", 405);

export const config: Config = { path: "/api/admin-logout" };
