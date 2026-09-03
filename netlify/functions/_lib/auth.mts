import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { json } from "./http.mts";

const COOKIE = "revive_admin";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createSession(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function sessionCookie(token: string) {
  const secure = process.env.CONTEXT === "dev" ? "" : "; Secure";
  return `${COOKIE}=${token}; Path=/; HttpOnly${secure}; SameSite=Strict; Max-Age=28800`;
}

export function clearSessionCookie() {
  const secure = process.env.CONTEXT === "dev" ? "" : "; Secure";
  return `${COOKIE}=; Path=/; HttpOnly${secure}; SameSite=Strict; Max-Age=0`;
}

export function readSession(request: Request): { email: string } | null {
  try {
    const cookie = request.headers.get("cookie") || "";
    const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    if (!token) return null;
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const expected = Buffer.from(sign(payload));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email: string; exp: number };
    return parsed.exp > Date.now() && parsed.email ? { email: parsed.email } : null;
  } catch { return null; }
}

export function requireAdmin(request: Request) {
  const session = readSession(request);
  return session ? { session } : { response: json({ message: "Administrator sign-in required." }, 401) };
}

export function verifyPassword(password: string, encoded: string) {
  try {
    const [scheme, salt, expected] = encoded.split("$");
    if (scheme !== "scrypt" || !salt || !expected) return false;
    const actual = scryptSync(password, salt, 64);
    const target = Buffer.from(expected, "hex");
    return actual.length === target.length && timingSafeEqual(actual, target);
  } catch { return false; }
}
