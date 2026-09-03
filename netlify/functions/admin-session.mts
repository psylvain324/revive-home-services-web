import type { Config } from "@netlify/functions";
import { readSession } from "./_lib/auth.mts";
import { fail, json } from "./_lib/http.mts";

export default (request: Request) => {
  if (request.method !== "GET") return fail("Method not allowed.", 405);
  const session = readSession(request);
  return json(session ? { authenticated: true, email: session.email } : { authenticated: false });
};

export const config: Config = { path: "/api/admin-session" };
