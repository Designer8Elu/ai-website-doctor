/**
 * Meta / SEO tag check.
 *
 * Reads the parsed document for the tags search engines and social cards rely
 * on, then confirms robots.txt and sitemap.xml are reachable.
 */

import type { CheerioAPI } from "cheerio";

import { describeFetchError, fetchWithTimeout } from "@/lib/http";
import type { CheckStatus, SeoCheck, SeoReport } from "@/lib/types";

/** Length windows Google's SERP tends to respect before truncating. */
const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 70;
const DESCRIPTION_MAX = 160;

const ROBOTS_TIMEOUT_MS = 10_000;

/** Read a meta tag by `name` or `property`, trimmed, ignoring empty values. */
function metaContent($: CheerioAPI, selector: string): string | null {
  const value = $(selector).first().attr("content");
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function lengthCheck(
  id: string,
  label: string,
  value: string | null,
  min: number,
  max: number,
): SeoCheck {
  if (!value) {
    return { id, label, status: "fail", value: null, detail: "Missing or empty." };
  }

  const length = value.length;
  const ideal = `ideal ${min}–${max}`;
  if (length < min) {
    return {
      id,
      label,
      status: "warn",
      value,
      detail: `${length} characters — shorter than recommended (${ideal}).`,
    };
  }
  if (length > max) {
    return {
      id,
      label,
      status: "warn",
      value,
      detail: `${length} characters — likely truncated in search results (${ideal}).`,
    };
  }
  return { id, label, status: "pass", value, detail: `${length} characters (${ideal}).` };
}

function presenceCheck(id: string, label: string, value: string | null, hint: string): SeoCheck {
  return value
    ? { id, label, status: "pass", value, detail: "Present." }
    : { id, label, status: "fail", value: null, detail: hint };
}

/** Fetch a site-root file and report whether it genuinely exists. */
async function checkRootFile(
  origin: string,
  path: string,
  id: string,
  label: string,
): Promise<{ check: SeoCheck; body: string | null }> {
  const target = new URL(path, origin).toString();

  try {
    const response = await fetchWithTimeout(target, { timeoutMs: ROBOTS_TIMEOUT_MS });

    if (!response.ok) {
      return {
        check: {
          id,
          label,
          status: "fail",
          value: target,
          detail: `Returned HTTP ${response.status}.`,
        },
        body: null,
      };
    }

    const body = await response.text();

    // Plenty of sites answer 200 with their normal HTML page (a soft 404) —
    // that is not a usable robots.txt or sitemap.
    if (/^\s*(<!doctype html|<html)/i.test(body)) {
      return {
        check: {
          id,
          label,
          status: "warn",
          value: target,
          detail: "Responded 200 but returned an HTML page, not a valid file.",
        },
        body,
      };
    }

    return {
      check: { id, label, status: "pass", value: target, detail: "Found." },
      body,
    };
  } catch (error) {
    return {
      check: {
        id,
        label,
        status: "fail",
        value: target,
        detail: `Could not be fetched — ${describeFetchError(error)}.`,
      },
      body: null,
    };
  }
}

/** Pull `Sitemap:` directives out of robots.txt. */
function parseDeclaredSitemaps(robotsBody: string | null): string[] {
  if (!robotsBody) return [];
  return robotsBody
    .split(/\r?\n/)
    .map((line) => /^\s*sitemap\s*:\s*(\S+)/i.exec(line)?.[1])
    .filter((value): value is string => Boolean(value))
    .slice(0, 5);
}

export async function runSeoCheck($: CheerioAPI, pageUrl: string): Promise<SeoReport> {
  const origin = new URL(pageUrl).origin;

  const title = $("head title").first().text().trim() || null;
  const description = metaContent($, 'meta[name="description" i]');
  const ogTitle = metaContent($, 'meta[property="og:title" i]');
  const ogDescription = metaContent($, 'meta[property="og:description" i]');
  const ogImage = metaContent($, 'meta[property="og:image" i]');
  const canonical = $('link[rel="canonical" i]').first().attr("href")?.trim() || null;

  const [robots, sitemap] = await Promise.all([
    checkRootFile(origin, "/robots.txt", "robots-txt", "robots.txt"),
    checkRootFile(origin, "/sitemap.xml", "sitemap-xml", "sitemap.xml"),
  ]);

  const checks: SeoCheck[] = [
    lengthCheck("title", "<title> tag", title, TITLE_MIN, TITLE_MAX),
    lengthCheck("description", "Meta description", description, DESCRIPTION_MIN, DESCRIPTION_MAX),
    presenceCheck("og-title", "og:title", ogTitle, "Missing — social shares will fall back to <title>."),
    presenceCheck(
      "og-description",
      "og:description",
      ogDescription,
      "Missing — social shares will have no summary text.",
    ),
    presenceCheck("og-image", "og:image", ogImage, "Missing — shared links will have no preview image."),
    presenceCheck(
      "canonical",
      "Canonical tag",
      canonical,
      "Missing — duplicate URLs may compete in search results.",
    ),
    robots.check,
    sitemap.check,
  ];

  const tally = (status: CheckStatus) => checks.filter((check) => check.status === status).length;

  return {
    checks,
    passed: tally("pass"),
    warned: tally("warn"),
    failed: tally("fail"),
    declaredSitemaps: parseDeclaredSitemaps(robots.body),
  };
}
