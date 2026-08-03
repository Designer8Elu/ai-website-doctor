import test from "node:test";
import assert from "node:assert/strict";
import * as cheerio from "cheerio";

import { runStructuredDataCheck } from "./structured-data";

test("accepts valid JSON-LD schema blocks", () => {
  const $ = cheerio.load(`<!DOCTYPE html>
<html>
  <head>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Example"}</script>
  </head>
  <body></body>
</html>`);

  const report = runStructuredDataCheck($);

  assert.equal(report.failed, 0);
  assert.equal(report.warned, 0);
});

test("flags missing or invalid schema blocks", () => {
  const $ = cheerio.load(`<!DOCTYPE html>
<html>
  <head>
    <script type="application/ld+json">{"name":"Example"}</script>
    <script type="application/ld+json">{bad json}</script>
  </head>
  <body></body>
</html>`);

  const report = runStructuredDataCheck($);

  assert.ok(report.issues.some((issue) => issue.label.includes("Structured data")));
});
