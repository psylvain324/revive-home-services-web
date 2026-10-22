import type { Config } from "@netlify/functions";
import { clearSessionCookie, createSession, sessionCookie, verifyPassword } from "./_lib/auth.mts";
import { body, cleanText, clientIp, fail, json } from "./_lib/http.mts";

const attempts = new Map<string, { count: number; reset: number }>();
const STATIC_ADMIN_EMAIL = "psylvain324@gmail.com";
const STATIC_ADMIN_PASSWORD_HASH = "scrypt$1fcc1c9af7f3b52b9a3e1081117a5716$757c9891aa947e34010a2e4b2e4f53d27856e9cdab67b0877f944d624a481098c70de770d35b0f7fcf9b7fd8ffb63c4e2ccf96ca86d91d51a26c74ad9116a179";

export default async (request: Request) => {
  if (request.method !== "POST") return fail("Method not allowed.", 405);
  const ip = clientIp(request);
  const now = Date.now();
  const rate = attempts.get(ip) || { count: 0, reset: now + 15 * 60_000 };
  if (rate.reset < now) { rate.count = 0; rate.reset = now + 15 * 60_000; }
  if (rate.count >= 10) return fail("Too many sign-in attempts. Try again later.", 429);
  try {
    const input = await body<{ email?: unknown; password?: unknown }>(request);
    const email = cleanText(input.email, 180).toLowerCase();
    const password = String(input.password ?? "");
    const expectedEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
    const passwordHash = process.env.ADMIN_PASSWORD_HASH || "";
    const staticUserMatches = email === STATIC_ADMIN_EMAIL && verifyPassword(password, STATIC_ADMIN_PASSWORD_HASH);
    const configuredUserMatches = Boolean(expectedEmail && passwordHash && email === expectedEmail && verifyPassword(password, passwordHash));
    if (!staticUserMatches && !configuredUserMatches) {
      rate.count += 1; attempts.set(ip, rate);
      return json({ message: "The email or password is incorrect." }, 401, { "Set-Cookie": clearSessionCookie() });
    }
    attempts.delete(ip);
    return json({ authenticated: true, email }, 200, { "Set-Cookie": sessionCookie(createSession(email)) });
  } catch (error) {
    console.error("admin-login", error);
    return fail("Unable to sign in.", 400);
  }
};

export const config: Config = { path: "/api/admin-login" };
