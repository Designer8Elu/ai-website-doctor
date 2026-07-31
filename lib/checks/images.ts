/**
 * Basic image check — reads every <img> in the parsed HTML and flags the two
 * cheap wins: a missing `alt` attribute and a missing `loading="lazy"`.
 *
 * FUTURE (v2): download each image and compare its intrinsic file size against
 * the size it is actually rendered at, plus modern-format (AVIF/WebP) hints.
 * That needs real network fetches per image, so it is deliberately out of the
 * MVP — this module stays purely static analysis.
 */

import type { CheerioAPI } from "cheerio";

import { resolveUrl } from "@/lib/url";
import type { ImageItem, ImagesReport } from "@/lib/types";

/** Keep the JSON payload sane on image-heavy pages. */
const MAX_REPORTED_IMAGES = 100;

/** Shorten data: URIs so they don't blow up the report. */
function displaySrc(raw: string, pageUrl: string): string {
  if (/^data:/i.test(raw)) {
    return `${raw.slice(0, 40)}… (inline data URI)`;
  }
  return resolveUrl(raw, pageUrl) ?? raw;
}

export function runImageCheck($: CheerioAPI, pageUrl: string): ImagesReport {
  const elements = $("img").toArray();

  const items: ImageItem[] = elements.map((element) => {
    const $img = $(element);

    // `.attr()` returns undefined when absent and "" when present-but-empty —
    // that distinction is the whole point for `alt`.
    const altAttr = $img.attr("alt");
    const alt = altAttr === undefined ? null : altAttr;
    const loading = $img.attr("loading")?.toLowerCase() ?? null;
    const width = $img.attr("width") ?? null;
    const height = $img.attr("height") ?? null;
    const rawSrc = $img.attr("src") ?? $img.attr("data-src") ?? $img.attr("srcset")?.split(/\s|,/)[0] ?? "";

    const issues: string[] = [];
    if (alt === null) {
      issues.push("Missing alt attribute");
    } else if (alt.trim() === "") {
      // Valid for purely decorative images, so this is a nudge, not an error.
      issues.push('Empty alt="" — fine if decorative, otherwise add a description');
    }
    if (loading !== "lazy") {
      issues.push('Missing loading="lazy"');
    }
    if (!width || !height) {
      issues.push("No width/height attributes — can cause layout shift (CLS)");
    }
    if (!rawSrc) {
      issues.push("No src attribute");
    }

    return {
      src: rawSrc ? displaySrc(rawSrc, pageUrl) : "(no src)",
      alt,
      loading,
      width,
      height,
      issues,
    };
  });

  return {
    total: items.length,
    missingAlt: items.filter((item) => item.alt === null).length,
    emptyAlt: items.filter((item) => item.alt !== null && item.alt.trim() === "").length,
    missingLazy: items.filter((item) => item.loading !== "lazy").length,
    missingDimensions: items.filter((item) => !item.width || !item.height).length,
    // Show problem images first so the truncated list is the useful half.
    items: [...items]
      .sort((a, b) => b.issues.length - a.issues.length)
      .slice(0, MAX_REPORTED_IMAGES),
    truncated: items.length > MAX_REPORTED_IMAGES,
  };
}
