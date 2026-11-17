import { randomUUID } from "node:crypto";
import type { Config } from "@netlify/functions";
import { EmailConfigurationError, EmailDeliveryError, sendConfiguredTestEmail } from "../../lib/resend.mjs";
import { requireAdmin } from "./_lib/auth.mts";
import { body, fail, json, RequestBodyError } from "./_lib/http.mts";

type TestEmailInput = { requestId?: unknown };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async (request: Request) => {
  if (request.method !== "POST") return json({ message: "Method not allowed." }, 405, { Allow: "POST" });
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  let input: TestEmailInput;
  try {
    input = await body<TestEmailInput>(request, 2_048);
  } catch (error) {
    return error instanceof RequestBodyError
      ? fail(error.message, error.status)
      : fail("Expected a JSON request.", 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return fail("Expected a JSON object.", 400);

  try {
    const requestId = typeof input.requestId === "string" && UUID_PATTERN.test(input.requestId)
      ? input.requestId
      : randomUUID();
    const result = await sendConfiguredTestEmail({ idempotencyKey: `revive-admin-test-${requestId}` });
    return json({ sent: true, id: result.id, recipient: result.recipient });
  } catch (error) {
    if (error instanceof EmailConfigurationError) return json({ message: "Resend is not configured for this environment." }, 503);
    if (error instanceof EmailDeliveryError) return json({ message: "Resend could not accept the test email. Check the server configuration and provider dashboard." }, 502);
    console.error("admin-email-test", error instanceof Error ? error.name : "UnknownError");
    return json({ message: "Unable to complete the email test." }, 500);
  }
};

export const config: Config = {
  path: "/api/admin-email-test",
  method: "POST",
  rateLimit: { aggregateBy: ["ip"], windowLimit: 2, windowSize: 3600 },
};
