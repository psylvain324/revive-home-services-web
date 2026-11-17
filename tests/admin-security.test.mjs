import assert from "node:assert/strict";
import test from "node:test";
import adminLoginEndpoint from "../netlify/functions/admin-login.mts";
import emailTestEndpoint from "../netlify/functions/admin-email-test.mts";
import { createSession, readSession } from "../netlify/functions/_lib/auth.mts";

const validEnvironment = {
  ADMIN_EMAIL: "owner@example.com",
  SESSION_SECRET: "t9X!2wQ#7zL$4mN%8pR&5sV*1yK@6cD_3fG+0hJ=",
};

async function withEnvironment(values, operation) {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return await operation();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function requestWithSession(body = JSON.stringify({ requestId: "00000000-0000-4000-8000-000000000001" })) {
  const token = createSession(validEnvironment.ADMIN_EMAIL);
  return new Request("https://example.com/api/admin-email-test", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `revive_admin=${token}` },
    body,
  });
}

test("admin sessions reject published placeholders and remain bound to the configured administrator", async () => {
  await withEnvironment({
    ADMIN_EMAIL: validEnvironment.ADMIN_EMAIL,
    SESSION_SECRET: "replace-with-at-least-32-random-characters",
  }, () => assert.throws(() => createSession(validEnvironment.ADMIN_EMAIL), /randomly generated/));

  await withEnvironment(validEnvironment, () => {
    const validToken = createSession(validEnvironment.ADMIN_EMAIL);
    const validRequest = new Request("https://example.com", { headers: { Cookie: `revive_admin=${validToken}` } });
    assert.deepEqual(readSession(validRequest), { email: validEnvironment.ADMIN_EMAIL });

    const otherToken = createSession("other@example.com");
    const otherRequest = new Request("https://example.com", { headers: { Cookie: `revive_admin=${otherToken}` } });
    assert.equal(readSession(otherRequest), null);
  });
});

test("admin email verification rejects unauthenticated and malformed requests", async () => {
  const unauthenticated = await emailTestEndpoint(new Request("https://example.com/api/admin-email-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }));
  assert.equal(unauthenticated.status, 401);
  assert.equal(unauthenticated.headers.get("x-content-type-options"), "nosniff");
  assert.equal(unauthenticated.headers.get("cache-control"), "no-store");

  await withEnvironment(validEnvironment, async () => {
    const malformed = await emailTestEndpoint(requestWithSession("not-json"));
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { message: "Expected valid JSON." });

    const oversized = await emailTestEndpoint(requestWithSession(JSON.stringify({ padding: "x".repeat(3_000) })));
    assert.equal(oversized.status, 413);
    assert.deepEqual(await oversized.json(), { message: "Request is too large." });
  });
});

test("admin login bounds the actual request body without trusting Content-Length", async () => {
  const oversized = await adminLoginEndpoint(new Request("https://example.com/api/admin-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "owner@example.com", password: "x".repeat(9_000) }),
  }));
  assert.equal(oversized.status, 413);
  assert.deepEqual(await oversized.json(), { message: "Request is too large." });
});

test("admin email verification fails closed when Resend is not configured", async () => {
  await withEnvironment({
    ...validEnvironment,
    RESEND_API_KEY: undefined,
    RESEND_FROM_EMAIL: undefined,
    RESEND_REPLY_TO_EMAIL: undefined,
    RESEND_TEST_TO_EMAIL: undefined,
  }, async () => {
    const response = await emailTestEndpoint(requestWithSession());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { message: "Resend is not configured for this environment." });
  });
});

test("admin email verification sends only to the server-configured recipient", async () => {
  const originalFetch = globalThis.fetch;
  let providerPayload;
  try {
    globalThis.fetch = async (_url, init) => {
      providerPayload = JSON.parse(init.body);
      return new Response(JSON.stringify({ id: "email_endpoint_test" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    await withEnvironment({
      ...validEnvironment,
      RESEND_API_KEY: "re_test_key_for_endpoint_checks",
      RESEND_FROM_EMAIL: "Revive Co <notifications@example.com>",
      RESEND_REPLY_TO_EMAIL: "owner@example.com",
      RESEND_TEST_TO_EMAIL: "delivered@resend.dev",
    }, async () => {
      const request = requestWithSession(JSON.stringify({
        requestId: "00000000-0000-4000-8000-000000000001",
        email: "attacker@example.net",
      }));
      const response = await emailTestEndpoint(request);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { sent: true, id: "email_endpoint_test", recipient: "d***@resend.dev" });
      assert.deepEqual(providerPayload.to, ["delivered@resend.dev"]);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
