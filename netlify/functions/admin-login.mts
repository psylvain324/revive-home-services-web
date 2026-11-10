import type { Config } from "@netlify/functions";
import { clearSessionCookie, createSession, sessionCookie, verifyPassword } from "./_lib/auth.mts";
import { body, cleanText, fail, json } from "./_lib/http.mts";

export default async (request: Request) => {
  if (request.method !== "POST") return fail("Method not allowed.", 405);
  try {
    const input = await body<{ email?: unknown; password?: unknown }>(request);
    const email = cleanText(input.email, 180).toLowerCase();
    const password = String(input.password ?? "");
    const expectedEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const passwordHash = process.env.ADMIN_PASSWORD_HASH || "";
    if (!expectedEmail || !passwordHash) return fail("Administrator access is not configured.", 503);
    if (email !== expectedEmail || !verifyPassword(password, passwordHash)) {
      return json({ message: "The email or password is incorrect." }, 401, { "Set-Cookie": clearSessionCookie() });
    }
    return json({ authenticated: true, email }, 200, { "Set-Cookie": sessionCookie(createSession(email)) });
  } catch (error) {
    console.error("admin-login", error);
    return fail("Unable to sign in.", 400);
  }
};

export const config: Config = {
  path: "/api/admin-login",
  method: "POST",
  rateLimit: { aggregateBy: ["ip"], windowLimit: 10, windowSize: 15 * 60 },
};
