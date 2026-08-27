/**
 * Image check — static HTML analysis (missing `alt`, `loading="lazy"`,
 * width/height) plus a lightweight weight analysis: a HEAD request per unique
 * image to read its real file size and format, so oversized or legacy-format
 * images can be flagged with actual numbers instead of guesses.
 */

import type { CheerioAPI } from "cheerio";

import { fetchWithTimeout, mapWithConcurrency } from "@/lib/http";
import { resolveUrl } from "@/lib/url";
import type { ImageItem, ImagesReport } from "@/lib/types";

/** Keep the JSON payload sane on image-heavy pages. */
const MAX_REPORTED_IMAGES = 100;

/** Cap real network fetches so the audit stays fast even on image-heavy pages. */
const MAX_WEIGHT_CHECKS = 24;
const WEIGHT_CONCURRENCY = 6;
const WEIGHT_TIMEOUT_MS = 8_000;

const HEAVY_IMAGE_BYTES = 200 * 1024;
const VERY_HEAVY_IMAGE_BYTES = 500 * 1024;
/** Below this, format-conversion savings aren't worth flagging (icons, etc). */
const MODERN_FORMAT_MIN_BYTES = 30 * 1024;

const LEGACY_FORMATS = new Set(["jpeg", "jpg", "png", "gif", "bmp"]);

/** Shorten data: URIs so they don't blow up the report. */
function displaySrc(raw: string, pageUrl: string): string {
  if (/^data:/i.test(raw)) {
    return `${raw.slice(0, 40)}… (inline data URI)`;
  }
  return resolveUrl(raw, pageUrl) ?? raw;
}

function formatFromContentType(contentType: string | null): string | null {
  if (!contentType) return null;
  const match = /image\/([a-z0-9+.-]+)/i.exec(contentType);
  if (!match) return null;
  return match[1].toLowerCase().replace("+xml", "").replace("x-", "");
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

interface WeightInfo {
  fileSizeBytes: number | null;
  format: string | null;
}

/** HEAD-fetch one image for its Content-Length/Content-Type. Failures just mean "unknown". */
async function fetchImageWeight(url: string): Promise<WeightInfo> {
  try {
    const response = await fetchWithTimeout(url, { method: "HEAD", timeoutMs: WEIGHT_TIMEOUT_MS });
    if (!response.ok) return { fileSizeBytes: null, format: null };

    const lengthHeader = response.headers.get("content-length");
    const fileSizeBytes = lengthHeader ? Number(lengthHeader) : null;

    return {
      fileSizeBytes: Number.isFinite(fileSizeBytes) ? fileSizeBytes : null,
      format: formatFromContentType(response.headers.get("content-type")),
    };
  } catch {
    return { fileSizeBytes: null, format: null };
  }
}

/** Image item plus the resolved URL used to fetch its weight — stripped before the report is returned. */
type WorkingImageItem = ImageItem & { fetchSrc: string | null };

export async function runImageCheck($: CheerioAPI, pageUrl: string): Promise<ImagesReport> {
  const elements = $("img").toArray();

  const items: WorkingImageItem[] = elements.map((element) => {
    const $img = $(element);

    // `.attr()` returns undefined when absent and "" when present-but-empty —
    // that distinction is the whole point for `alt`.
    const altAttr = $img.attr("alt");
    const alt = altAttr === undefined ? null : altAttr;
    const loading = $img.attr("loading")?.toLowerCase() ?? null;
    const width = $img.attr("width") ?? null;
    const height = $img.attr("height") ?? null;
    const rawSrc = $img.attr("src") ?? $img.attr("data-src") ?? $img.attr("srcset")?.split(/\s|,/)[0] ?? "";
    const resolvedSrc = rawSrc && !/^data:/i.test(rawSrc) ? resolveUrl(rawSrc, pageUrl) : null;

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
      fetchSrc: resolvedSrc,
      fileSizeBytes: null,
      format: null,
    };
  });

  // Weight-check every unique fetchable image, capped for latency/bandwidth.
  const uniqueUrls = [...new Set(items.map((item) => item.fetchSrc).filter((url): url is string => Boolean(url)))].slice(
    0,
    MAX_WEIGHT_CHECKS,
  );
  const weights = new Map(
    (
      await mapWithConcurrency(uniqueUrls, WEIGHT_CONCURRENCY, async (url) => [url, await fetchImageWeight(url)] as const)
    ).map(([url, info]) => [url, info]),
  );

  let heavyImages = 0;
  let legacyFormatImages = 0;

  for (const item of items) {
    const weight = item.fetchSrc ? weights.get(item.fetchSrc) : undefined;
    if (!weight) continue;

    item.fileSizeBytes = weight.fileSizeBytes;
    item.format = weight.format;

    if (weight.fileSizeBytes !== null) {
      if (weight.fileSizeBytes >= VERY_HEAVY_IMAGE_BYTES) {
        item.issues.push(`Very large file (${formatBytes(weight.fileSizeBytes)}) — compress or resize this image`);
        heavyImages += 1;
      } else if (weight.fileSizeBytes >= HEAVY_IMAGE_BYTES) {
        item.issues.push(`Large file (${formatBytes(weight.fileSizeBytes)}) — consider compressing`);
        heavyImages += 1;
      }
    }

    if (
      weight.format &&
      LEGACY_FORMATS.has(weight.format) &&
      (weight.fileSizeBytes === null || weight.fileSizeBytes >= MODERN_FORMAT_MIN_BYTES)
    ) {
      item.issues.push(`Served as ${weight.format.toUpperCase()} — WebP or AVIF would be smaller for the same quality`);
      legacyFormatImages += 1;
    }
  }

  return {
    total: items.length,
    missingAlt: items.filter((item) => item.alt === null).length,
    emptyAlt: items.filter((item) => item.alt !== null && item.alt.trim() === "").length,
    missingLazy: items.filter((item) => item.loading !== "lazy").length,
    missingDimensions: items.filter((item) => !item.width || !item.height).length,
    heavyImages,
    legacyFormatImages,
    weightChecked: uniqueUrls.length,
    // Show problem images first so the truncated list is the useful half.
    items: [...items]
      .sort((a, b) => b.issues.length - a.issues.length)
      .slice(0, MAX_REPORTED_IMAGES)
      .map(({ fetchSrc: _fetchSrc, ...item }) => item),
    truncated: items.length > MAX_REPORTED_IMAGES,
  };
}
