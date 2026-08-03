import assert from "node:assert/strict";
import test from "node:test";

import { buildFixDraft } from "./fix-draft.ts";

test("buildFixDraft creates an image patch for missing alt text", () => {
  const draft = buildFixDraft({
    category: "Images",
    label: "Image hygiene issue",
    status: "warn",
    detail: "Missing alt text; missing lazy loading",
    value: "https://example.com/logo.png",
    pageUrl: "https://example.com",
  });

  assert.match(draft.patch, /<img/i);
  assert.match(draft.patch, /alt=/i);
  assert.match(draft.patch, /loading="lazy"/i);
  assert.match(draft.summary, /image/i);
});

test("buildFixDraft creates an SEO patch for missing meta tags", () => {
  const draft = buildFixDraft({
    category: "SEO tags",
    label: "Missing meta description",
    status: "warn",
    detail: "The page is missing a meta description tag.",
    pageUrl: "https://example.com",
  });

  assert.match(draft.patch, /<meta name="description"/i);
  assert.match(draft.summary, /seo/i);
});
