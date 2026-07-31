import test from "node:test";
import assert from "node:assert/strict";

import { validateHtmlDocument } from "./html.ts";

test("accepts well-formed HTML with doctype and required structure", () => {
  const report = validateHtmlDocument(`<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Example</title>
  </head>
  <body>
    <main><p>Hello</p></main>
  </body>
</html>`);

  assert.equal(report.valid, true);
  assert.equal(report.issues.length, 0);
});

test("flags missing doctype and unclosed tags", () => {
  const report = validateHtmlDocument(`<html>
  <head><title>Broken</title>
  <body>
    <div><span>Oops</div>
  </body>
</html>`);

  assert.equal(report.valid, false);
  assert.ok(report.issues.some((issue) => issue.toLowerCase().includes("doctype")));
  assert.ok(report.issues.some((issue) => issue.toLowerCase().includes("unclosed") || issue.toLowerCase().includes("mismatched")));
});

test("reports the specific unclosed tag", () => {
  const report = validateHtmlDocument(`<div><section><p>hello</div>`);

  assert.equal(report.valid, false);
  assert.ok(report.issues.some((issue) => issue.toLowerCase().includes("<div>")));
  assert.ok(report.issues.some((issue) => issue.toLowerCase().includes("unclosed") || issue.toLowerCase().includes("mismatched")));
});

test("does not return duplicate issue messages", () => {
  const report = validateHtmlDocument(`<div><span></div></div>`);

  assert.equal(report.valid, false);
  assert.equal(new Set(report.issues).size, report.issues.length);
});

test("ignores tags inside scripts and comments", () => {
  const report = validateHtmlDocument(`<!DOCTYPE html>
<html>
  <head><title>Example</title></head>
  <body>
    <script>const tpl = "<div><span>test";</script>
    <!-- <div><span>ignored</div> -->
  </body>
</html>`);

  assert.equal(report.valid, true);
  assert.equal(report.issues.length, 0);
});
