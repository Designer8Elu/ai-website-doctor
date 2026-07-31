/**
 * Basic broken-link check.
 *
 * MVP scope: internal (same-domain) links found on the audited page only.
 * FUTURE: follow external links too, and crawl the whole site rather than one
 * page — both need rate limiting and a queue, so they are out of the MVP.
 */

import type { CheerioAPI } from "cheerio";

import { describeFetchError, fetchWithTimeout, mapWithConcurrency } from "@/lib/http";
import { isBlockedHost, isSameHost, resolveUrl } from "@/lib/url";
import type { LinkResult, LinksReport } from "@/lib/types";

/** Cap requests so one audit can't hammer a site (or blow the request budget). */
const MAX_LINKS = 40;
const CONCURRENCY = 8;
const LINK_TIMEOUT_MS = 10_000;

const IGNORED_SCHEMES = /^(mailto:|tel:|sms:|javascript:|data:|#)/i;

/** Collect unique, same-domain, http(s) links from the document. */
function collectInternalLinks($: CheerioAPI, pageUrl: string): string[] {
  const seen = new Set<string>();

  for (const element of $("a[href]").toArray()) {
    const href = $(element).attr("href")?.trim();
    if (!href || IGNORED_SCHEMES.test(href)) continue;

    const absolute = resolveUrl(href, pageUrl);
    if (!absolute) continue;

    const parsed = new URL(absolute);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") continue;
    if (!isSameHost(absolute, pageUrl)) continue;
    if (isBlockedHost(parsed.hostname)) continue;

    // Fragments point at the same document, so normalise them away.
    parsed.hash = "";
    seen.add(parsed.toString());
  }

  return [...seen];
}

async function checkLink(url: string): Promise<LinkResult> {
  const base: LinkResult = {
    url,
    status: null,
    ok: false,
    method: "HEAD",
    error: null,
    redirectedTo: null,
  };

  try {
    const head = await fetchWithTimeout(url, { method: "HEAD", timeoutMs: LINK_TIMEOUT_MS });

    // Some servers don't implement HEAD properly — retry those with GET before
    // calling the link broken.
    const headUnsupported = head.status === 405 || head.status === 501 || head.status === 403;
    if (!headUnsupported) {
      return {
        ...base,
        status: head.status,
        ok: head.ok,
        redirectedTo: head.url && head.url !== url ? head.url : null,
      };
    }
  } catch {
    // Fall through to the GET retry — a HEAD-level failure is not conclusive.
  }

  try {
    const get = await fetchWithTimeout(url, { method: "GET", timeoutMs: LINK_TIMEOUT_MS });
    return {
      ...base,
      method: "GET",
      status: get.status,
      ok: get.ok,
      redirectedTo: get.url && get.url !== url ? get.url : null,
    };
  } catch (error) {
    return { ...base, method: "GET", error: describeFetchError(error) };
  }
}

export async function runLinkCheck($: CheerioAPI, pageUrl: string): Promise<LinksReport> {
  const links = collectInternalLinks($, pageUrl);
  const targets = links.slice(0, MAX_LINKS);

  const results = await mapWithConcurrency(targets, CONCURRENCY, checkLink);

  return {
    found: links.length,
    checked: targets.length,
    truncated: links.length > MAX_LINKS,
    // A link is broken if it errored (timeout/DNS/refused) or answered 4xx/5xx.
    broken: results.filter((result) => !result.ok),
    results,
  };
}
