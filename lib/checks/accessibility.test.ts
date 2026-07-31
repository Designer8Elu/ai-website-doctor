import test from "node:test";
import assert from "node:assert/strict";
import * as cheerio from "cheerio";

import { runAccessibilityCheck } from "./accessibility";

test("passes for accessible markup", () => {
  const $ = cheerio.load(`<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Example page</title>
  </head>
  <body>
    <main>
      <h1>Welcome</h1>
      <img src="/hero.png" alt="Hero illustration" />
      <label for="name">Name</label>
      <input id="name" />
      <a href="/about">About</a>
    </main>
  </body>
</html>`);

  const report = runAccessibilityCheck($);

  assert.equal(report.failed, 0);
  assert.equal(report.warned, 0);
});

test("reports missing lang, title, and labels", () => {
  const $ = cheerio.load(`<!DOCTYPE html>
<html>
  <head></head>
  <body>
    <main>
      <img src="/hero.png" />
      <input />
      <button></button>
    </main>
  </body>
</html>`);

  const report = runAccessibilityCheck($);

  assert.ok(report.issues.some((issue) => issue.label.includes("language")));
  assert.ok(report.issues.some((issue) => issue.label.includes("title")));
  assert.ok(report.issues.some((issue) => issue.label.includes("form labels") || issue.label.includes("input")));
});
