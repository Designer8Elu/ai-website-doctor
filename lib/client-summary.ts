/** Condenses a finished AuditReport into a prompt for a plain-English, client-facing summary. */

import type { AuditReport } from "./types";

interface LabeledIssue {
  label: string;
  detail: string;
}

/** Accessibility often repeats the same label once per offending element (e.g. 18x "Missing image alt text"). */
function dedupeIssues(issues: LabeledIssue[]): string {
  if (issues.length === 0) return "  - None";

  const counts = new Map<string, { detail: string; count: number }>();
  for (const issue of issues) {
    const existing = counts.get(issue.label);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(issue.label, { detail: issue.detail, count: 1 });
    }
  }

  return [...counts.entries()]
    .map(([label, { detail, count }]) => `  - ${label}${count > 1 ? ` (${count}x)` : ""}: ${detail}`)
    .join("\n");
}

function listOrNone(lines: string[]): string {
  return lines.length > 0 ? lines.join("\n") : "  - None";
}

export function buildClientSummaryPrompt(report: AuditReport): string {
  const pageUrl = report.page.data?.finalUrl ?? report.requestedUrl;

  const mobileScore = report.performance.mobile.data?.performanceScore;
  const desktopScore = report.performance.desktop.data?.performanceScore;

  const seo = report.seo.data;
  const failingSeo = seo?.checks.filter((check) => check.status !== "pass") ?? [];

  const contentSeo = report.contentSeo.data;
  const failingContentSeo = contentSeo?.checks.filter((check) => check.status !== "pass") ?? [];

  const images = report.images.data;
  const links = report.links.data;
  const html = report.html.data;
  const accessibility = report.accessibility.data;
  const security = report.security.data;
  const structuredData = report.structuredData.data;

  const sections = [
    `Website: ${pageUrl}`,
    "",
    "=== PERFORMANCE (Lighthouse) ===",
    `Mobile score: ${mobileScore ?? "unavailable"}/100`,
    `Desktop score: ${desktopScore ?? "unavailable"}/100`,
    "",
    "=== SEO TAGS ===",
    seo
      ? `${seo.passed} passed, ${seo.warned} to review, ${seo.failed} failing.\n${listOrNone(
          failingSeo.map((check) => `  - ${check.label}: ${check.detail}`),
        )}`
      : "Check unavailable.",
    "",
    "=== CONTENT SEO ===",
    contentSeo
      ? `${contentSeo.passed} passed, ${contentSeo.warned} to review, ${contentSeo.failed} failing. Word count: ${contentSeo.wordCount}. H1 headings: ${contentSeo.h1Count}.\n${listOrNone(
          failingContentSeo.map((check) => `  - ${check.label}: ${check.detail}`),
        )}`
      : "Check unavailable.",
    "",
    "=== IMAGES ===",
    images
      ? `${images.total} images found. ${images.missingAlt} missing alt text, ${images.missingLazy} missing lazy-loading, ${images.heavyImages} oversized files, ${images.legacyFormatImages} in outdated formats (JPEG/PNG instead of WebP/AVIF).`
      : "Check unavailable.",
    "",
    "=== INTERNAL LINKS ===",
    links
      ? `${links.broken.length} broken out of ${links.checked} internal links checked.\n${listOrNone(
          links.broken.slice(0, 10).map((link) => `  - ${link.url}: ${link.error ?? `HTTP ${link.status}`}`),
        )}`
      : "Check unavailable.",
    "",
    "=== HTML STRUCTURE ===",
    html ? (html.valid ? "No structural issues." : listOrNone(html.issues.map((issue) => `  - ${issue}`))) : "Check unavailable.",
    "",
    "=== ACCESSIBILITY ===",
    accessibility
      ? `${accessibility.failed} blocking issues, ${accessibility.warned} warnings.\n${dedupeIssues(accessibility.issues)}`
      : "Check unavailable.",
    "",
    "=== SECURITY HEADERS ===",
    security
      ? `${security.failed} missing headers.\n${listOrNone(security.issues.map((issue) => `  - ${issue.label}: ${issue.detail}`))}`
      : "Check unavailable.",
    "",
    "=== STRUCTURED DATA (SCHEMA.ORG) ===",
    structuredData
      ? `${structuredData.failed} issues found.\n${listOrNone(
          structuredData.issues.map((issue) => `  - ${issue.label}: ${issue.detail}`),
        )}`
      : "Check unavailable.",
  ].join("\n");

  return [
    "You are a website consultant writing a summary of a technical audit for a non-technical client — a business owner who does not code.",
    "Use plain English with no jargon (briefly explain any technical term you must use), and a warm, professional tone.",
    "",
    "Here is the raw audit data:",
    "",
    sections,
    "",
    "Write the summary in Markdown with exactly these sections:",
    "1. **Overall health** — one short paragraph in plain language on the general state of the site.",
    "2. **What's working well** — 2-4 bullets. Omit this section entirely if there is genuinely nothing to praise.",
    "3. **Top priority fixes** — a ranked list of at most 6 items, most business-impact first, pulled from ANY category above (not grouped by category). For each: what's wrong in plain language, why it matters to visitors or the business, and how urgent it is.",
    "4. **Next steps** — one short closing paragraph.",
    "",
    "Do not quote raw technical labels verbatim — translate everything into plain language. Do not pad the response with disclaimers or mention that you are an AI.",
  ].join("\n");
}
