import { randomUUID } from "node:crypto";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "EmailConfigurationError";
  }
}

export class EmailDeliveryError extends Error {
  constructor(message) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

function emailAddress(value) {
  const normalized = String(value ?? "").trim();
  const displayNameMatch = normalized.match(/<([^<>]+)>$/);
  return displayNameMatch ? displayNameMatch[1].trim() : normalized;
}

function assertEmail(value, variableName) {
  if (!EMAIL_PATTERN.test(emailAddress(value))) {
    throw new EmailConfigurationError(`${variableName} must contain a valid email address.`);
  }
}

export function getResendConfig(env = process.env) {
  const apiKey = String(env.RESEND_API_KEY ?? "").trim();
  const from = String(env.RESEND_FROM_EMAIL ?? "").trim();
  const replyTo = String(env.RESEND_REPLY_TO_EMAIL ?? "").trim();
  const testTo = String(env.RESEND_TEST_TO_EMAIL ?? "delivered@resend.dev").trim();

  if (!apiKey || !apiKey.startsWith("re_") || apiKey.length < 12) {
    throw new EmailConfigurationError("RESEND_API_KEY is not configured.");
  }
  if (!from) throw new EmailConfigurationError("RESEND_FROM_EMAIL is not configured.");
  assertEmail(from, "RESEND_FROM_EMAIL");
  assertEmail(testTo, "RESEND_TEST_TO_EMAIL");
  if (replyTo) assertEmail(replyTo, "RESEND_REPLY_TO_EMAIL");

  return Object.freeze({ apiKey, from, replyTo, testTo });
}

export function maskEmail(value) {
  const [local = "", domain = ""] = emailAddress(value).split("@");
  if (!local || !domain) return "configured recipient";
  return `${local.slice(0, 1)}***@${domain}`;
}

export async function sendResendEmail(message, options = {}) {
  const config = getResendConfig(options.env);
  assertEmail(message.to, "Email recipient");
  const subject = String(message.subject ?? "").trim().slice(0, 200);
  const html = String(message.html ?? "").trim();
  const text = String(message.text ?? "").trim();
  if (!subject || !html || !text) throw new EmailConfigurationError("Email subject, HTML, and text content are required.");

  const idempotencyKey = String(message.idempotencyKey || `revive-${randomUUID()}`).slice(0, 200);
  const timeoutMs = Math.min(30_000, Math.max(1_000, Number(options.timeoutMs) || 10_000));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  try {
    const payload = {
      from: config.from,
      to: [message.to],
      subject,
      html,
      text,
      ...(config.replyTo ? { reply_to: config.replyTo } : {}),
    };
    const response = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "User-Agent": "revive-home-services/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new EmailDeliveryError(`Email provider rejected the request with status ${response.status}.`);
    if (!result || typeof result.id !== "string" || !result.id) throw new EmailDeliveryError("Email provider returned an invalid response.");
    return { id: result.id, recipient: maskEmail(message.to) };
  } catch (error) {
    if (error instanceof EmailConfigurationError || error instanceof EmailDeliveryError) throw error;
    if (controller.signal.aborted) throw new EmailDeliveryError("Email provider request timed out.");
    throw new EmailDeliveryError("Email provider request failed.");
  } finally {
    clearTimeout(timeout);
  }
}

export function sendConfiguredTestEmail(options = {}) {
  const config = getResendConfig(options.env);
  const now = options.now instanceof Date ? options.now : new Date();
  const timestamp = now.toISOString();
  return sendResendEmail({
    to: config.testTo,
    subject: "Revive Co email delivery test",
    text: `Revive Co's Resend integration completed a delivery test at ${timestamp}. No customer data was included.`,
    html: `<main style="font-family:Arial,sans-serif;line-height:1.6;color:#1f3025"><h1 style="color:#2e4637">Revive Co email delivery test</h1><p>The Resend integration completed a delivery test at <strong>${timestamp}</strong>.</p><p>No customer data was included in this message.</p></main>`,
    idempotencyKey: options.idempotencyKey || `revive-test-${randomUUID()}`,
  }, options);
}
