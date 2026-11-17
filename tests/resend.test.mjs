import assert from "node:assert/strict";
import test from "node:test";
import {
  EmailConfigurationError,
  EmailDeliveryError,
  getResendConfig,
  sendConfiguredTestEmail,
} from "../lib/resend.mjs";

const configuredEnvironment = {
  RESEND_API_KEY: "re_test_key_for_automated_checks",
  RESEND_FROM_EMAIL: "Revive Co <notifications@example.com>",
  RESEND_REPLY_TO_EMAIL: "owner@example.com",
  RESEND_TEST_TO_EMAIL: "delivered@resend.dev",
};

test("Resend configuration fails closed without server credentials", () => {
  assert.throws(() => getResendConfig({}), EmailConfigurationError);
  assert.throws(
    () => getResendConfig({ ...configuredEnvironment, RESEND_FROM_EMAIL: "not-an-email" }),
    /valid email address/,
  );
});

test("Resend test delivery uses a fixed configured recipient and idempotency key", async () => {
  let request;
  const result = await sendConfiguredTestEmail({
    env: configuredEnvironment,
    idempotencyKey: "revive-test-00000000-0000-4000-8000-000000000001",
    now: new Date("2026-11-16T12:00:00.000Z"),
    fetchImpl: async (url, init) => {
      request = { url, init };
      return new Response(JSON.stringify({ id: "email_test_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  assert.equal(result.id, "email_test_123");
  assert.equal(result.recipient, "d***@resend.dev");
  assert.equal(request.url, "https://api.resend.com/emails");
  assert.equal(request.init.headers.Authorization, `Bearer ${configuredEnvironment.RESEND_API_KEY}`);
  assert.equal(request.init.headers["Idempotency-Key"], "revive-test-00000000-0000-4000-8000-000000000001");
  const payload = JSON.parse(request.init.body);
  assert.deepEqual(payload.to, [configuredEnvironment.RESEND_TEST_TO_EMAIL]);
  assert.equal(payload.from, configuredEnvironment.RESEND_FROM_EMAIL);
  assert.equal(payload.reply_to, configuredEnvironment.RESEND_REPLY_TO_EMAIL);
  assert.match(payload.text, /No customer data/);
  assert.doesNotMatch(payload.text, /booking|payment|@/i);
});

test("Resend provider errors are sanitized", async () => {
  await assert.rejects(
    sendConfiguredTestEmail({
      env: configuredEnvironment,
      fetchImpl: async () => new Response(JSON.stringify({ message: "sensitive provider detail" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
    }),
    (error) => {
      assert.ok(error instanceof EmailDeliveryError);
      assert.match(error.message, /status 422/);
      assert.doesNotMatch(error.message, /sensitive|re_test/);
      return true;
    },
  );
});

test("Resend delivery times out instead of hanging a function", async () => {
  await assert.rejects(
    sendConfiguredTestEmail({
      env: configuredEnvironment,
      timeoutMs: 1_000,
      fetchImpl: async (_url, init) => new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      }),
    }),
    (error) => error instanceof EmailDeliveryError && /timed out/.test(error.message),
  );
});
