export function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

export function fail(message: string, status = 400) {
  return json({ message }, status);
}

export async function body<T>(request: Request): Promise<T> {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw new Error("Expected a JSON request.");
  return request.json() as Promise<T>;
}

export function cleanText(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

export function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

export function validTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function safeNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export function requestOrigin(request: Request) {
  const configured = process.env.URL || process.env.DEPLOY_PRIME_URL;
  return configured || new URL(request.url).origin;
}

export function clientIp(request: Request) {
  return request.headers.get("x-nf-client-connection-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
}
