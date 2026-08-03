/**
 * Audit orchestrator.
 *
 * Runs every check for one URL and assembles the single `AuditReport` object
 * the API route returns. Checks are grouped into two independent branches that
 * run concurrently:
 *
 *   1. PageSpeed Insights (mobile + desktop) — remote Lighthouse runs.
 *   2. Content checks — one HTML fetch, then SEO / images / links off the same
 *      parsed document.
 *
 * Every branch is settled individually so one failure never takes the report
 * down with it.
 */

import * as cheerio from "cheerio";

import { fetchPage } from "@/lib/checks/page";
import { runContentSeoQualityCheck } from "@/lib/checks/content-seo";
import { runImageCheck } from "@/lib/checks/images";
import { runLinkCheck } from "@/lib/checks/links";
import { runPageSpeed } from "@/lib/checks/performance";
import { runSeoCheck } from "@/lib/checks/seo";
import { validateHtmlDocument } from "@/lib/checks/html";
import { runAccessibilityCheck } from "@/lib/checks/accessibility";
import { resolveUrl } from "@/lib/url";
import type {
  AccessibilityReport,
  AuditReport,
  ContentSeoQualityReport,
  HtmlReport,
  ImagesReport,
  LinksReport,
  PageInfo,
  SectionResult,
  SeoReport,
} from "@/lib/types";

function ok<T>(data: T): SectionResult<T> {
  return { data, error: null };
}

function fail<T>(error: string): SectionResult<T> {
  return { data: null, error };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Convert a settled promise into a SectionResult. */
function settledToSection<T>(settled: PromiseSettledResult<T>): SectionResult<T> {
  return settled.status === "fulfilled" ? ok(settled.value) : fail(messageOf(settled.reason));
}

interface ContentBranch {
  page: SectionResult<PageInfo>;
  seo: SectionResult<SeoReport>;
  contentSeo: SectionResult<ContentSeoQualityReport>;
  images: SectionResult<ImagesReport>;
  links: SectionResult<LinksReport>;
  html: SectionResult<HtmlReport>;
  accessibility: SectionResult<AccessibilityReport>;
}

/** Fetch the HTML once, then run everything that reads from it. */
async function runContentChecks(url: string): Promise<ContentBranch> {
  let html: string;
  let info: PageInfo;

  try {
    const page = await fetchPage(url);
    html = page.html;
    info = page.info;
  } catch (error) {
    // Without the HTML none of the three content checks can run.
    const message = messageOf(error);
    return {
      page: fail(message),
      seo: fail(message),
      contentSeo: fail(message),
      images: fail(message),
      links: fail(message),
      html: fail(message),
      accessibility: fail(message),
    };
  }

  const $ = cheerio.load(html);
  // Resolve relative URLs against the post-redirect URL, and honour <base href>.
  const baseHref = $("base[href]").first().attr("href");
  const baseUrl = (baseHref ? resolveUrl(baseHref, info.finalUrl) : null) ?? info.finalUrl;

  const [seo, contentSeo, images, links, accessibility] = await Promise.allSettled([
    runSeoCheck($, baseUrl),
    Promise.resolve(runContentSeoQualityCheck($, baseUrl)),
    Promise.resolve(runImageCheck($, baseUrl)),
    runLinkCheck($, baseUrl),
    Promise.resolve(runAccessibilityCheck($)),
  ]);

  const htmlReport = validateHtmlDocument(html);

  return {
    page: ok(info),
    seo: settledToSection(seo),
    contentSeo: settledToSection(contentSeo),
    images: settledToSection(images),
    links: settledToSection(links),
    html: ok(htmlReport),
    accessibility: settledToSection(accessibility),
  };
}

export async function runAudit(url: string): Promise<AuditReport> {
  const startedAt = Date.now();

  const [performance, content] = await Promise.all([
    Promise.allSettled([runPageSpeed(url, "mobile"), runPageSpeed(url, "desktop")]),
    runContentChecks(url),

    /* FUTURE MODULES — add them to this Promise.all so they run in parallel:
     *   runCodeAudit(url)        → unused CSS, minification, console errors
     *   generateRecommendations(report) → AI plain-English summary (runs last,
     *                                     needs the finished report as input)
     */
  ]);

  return {
    requestedUrl: url,
    fetchedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    page: content.page,
    performance: {
      mobile: settledToSection(performance[0]),
      desktop: settledToSection(performance[1]),
    },
    seo: content.seo,
    contentSeo: content.contentSeo,
    images: content.images,
    links: content.links,
    html: content.html,
    accessibility: content.accessibility,
  };
}
