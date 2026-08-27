import test from "node:test";
import assert from "node:assert/strict";

import { callGeminiText, GeminiError } from "./gemini";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function okBody(text: string) {
  return { candidates: [{ content: { parts: [{ text }] } }] };
}

function overloadedBody() {
  return { error: { code: 503, message: "The model is overloaded. Please try again later.", status: "UNAVAILABLE" } };
}

test.beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-key";
});

test.afterEach(() => {
  delete (globalThis as { fetch?: typeof fetch }).fetch;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
});

test("succeeds on the first attempt without retrying", async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return jsonResponse(200, okBody("hello"));
  }) as typeof fetch;

  const result = await callGeminiText("prompt");
  assert.equal(result.text, "hello");
  assert.equal(calls, 1);
});

test("retries the primary model once on overload, then succeeds", async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    if (calls === 1) return jsonResponse(503, overloadedBody());
    return jsonResponse(200, okBody("recovered"));
  }) as typeof fetch;

  const result = await callGeminiText("prompt");
  assert.equal(result.text, "recovered");
  assert.equal(calls, 2);
});

test("falls back to the stable model when the primary keeps overloading", async () => {
  const modelsCalled: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const match = /models\/([^:]+):generateContent/.exec(url);
    modelsCalled.push(match?.[1] ?? "unknown");
    if (modelsCalled.length <= 2) return jsonResponse(503, overloadedBody());
    return jsonResponse(200, okBody("fallback worked"));
  }) as typeof fetch;

  const result = await callGeminiText("prompt");
  assert.equal(result.text, "fallback worked");
  assert.equal(result.model, "gemini-2.5-flash");
  assert.deepEqual(modelsCalled, ["gemini-3.6-flash", "gemini-3.6-flash", "gemini-2.5-flash"]);
});

test("throws a friendly error when every model is overloaded", async () => {
  globalThis.fetch = (async () => jsonResponse(503, overloadedBody())) as typeof fetch;

  await assert.rejects(() => callGeminiText("prompt"), (err: unknown) => {
    assert.ok(err instanceof GeminiError);
    assert.equal(err.status, 503);
    assert.match(err.message, /high demand/i);
    return true;
  });
});

test("fails fast without retrying on a non-overload error", async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return jsonResponse(400, { error: { code: 400, message: "Invalid argument.", status: "INVALID_ARGUMENT" } });
  }) as typeof fetch;

  await assert.rejects(() => callGeminiText("prompt"), (err: unknown) => {
    assert.ok(err instanceof GeminiError);
    assert.equal(err.message, "Invalid argument.");
    return true;
  });
  assert.equal(calls, 1);
});
