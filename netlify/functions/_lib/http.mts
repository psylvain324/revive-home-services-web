export class RequestBodyError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "RequestBodyError";
    this.status = status;
  }
}

export function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
      ...headers,
    },
  });
}

export function fail(message: string, status = 400) {
  return json({ message }, status);
}

export async function body<T>(request: Request, maxBytes = 65_536): Promise<T> {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw new RequestBodyError("Expected a JSON request.");
  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsedLength = Number(declaredLength);
    if (!Number.isFinite(parsedLength) || parsedLength < 0) throw new RequestBodyError("Invalid request length.");
    if (parsedLength > maxBytes) throw new RequestBodyError("Request is too large.", 413);
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) throw new RequestBodyError("Request is too large.", 413);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new RequestBodyError("Expected valid JSON.");
  }
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
