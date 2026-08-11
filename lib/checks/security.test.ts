import test from "node:test";
import assert from "node:assert/strict";

import { runSecurityHeadersCheck } from "./security";

test("passes when expected security headers are present", () => {
  const report = runSecurityHeadersCheck({
    "x-frame-options": "DENY",
    "strict-transport-security": "max-age=31536000",
    "content-security-policy": "default-src 'self'",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-content-type-options": "nosniff",
  });

  assert.equal(report.failed, 0);
  assert.equal(report.warned, 0);
});

test("flags missing security headers", () => {
  const report = runSecurityHeadersCheck({});

  assert.ok(report.issues.some((issue) => issue.label.includes("X-Frame-Options")));
  assert.ok(report.issues.some((issue) => issue.label.includes("HSTS")));
  assert.ok(report.issues.some((issue) => issue.label.includes("Content-Security-Policy")));
});
