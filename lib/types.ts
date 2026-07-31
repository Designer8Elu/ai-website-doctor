/**
 * Shared types for the Ai Website Doctor audit pipeline.
 *
 * The API route returns exactly one `AuditReport` object. Every section is
 * wrapped in `SectionResult` so a single failing check (e.g. PageSpeed
 * rate-limiting us) degrades that section only instead of killing the report.
 */

export type CheckStatus = "pass" | "warn" | "fail";

/** A section either has data or an error string — never both, never neither. */
export interface SectionResult<T> {
  data: T | null;
  error: string | null;
}

/* ------------------------------------------------------------------ *
 * Performance (Google PageSpeed Insights)
 * ------------------------------------------------------------------ */

export type Strategy = "mobile" | "desktop";

export interface PerfMetric {
  id: string;
  label: string;
  /** Human readable value straight from Lighthouse, e.g. "2.4 s". */
  displayValue: string | null;
  numericValue: number | null;
  /** Lighthouse audit score, 0–1. Used for the green/yellow/red pill. */
  score: number | null;
}

export interface PerfSuggestion {
  id: string;
  title: string;
  description: string;
  score: number | null;
  /** Estimated savings in ms, when Lighthouse provides one. */
  savingsMs: number | null;
  displayValue: string | null;
}

export interface StrategyReport {
  strategy: Strategy;
  /** 0–100, or null when Lighthouse could not compute a score. */
  performanceScore: number | null;
  metrics: PerfMetric[];
  suggestions: PerfSuggestion[];
  lighthouseVersion: string | null;
}

export interface PerformanceReport {
  mobile: SectionResult<StrategyReport>;
  desktop: SectionResult<StrategyReport>;
}

/* ------------------------------------------------------------------ *
 * Meta / SEO tags
 * ------------------------------------------------------------------ */

export interface SeoCheck {
  id: string;
  label: string;
  status: CheckStatus;
  /** The actual tag content, when present. */
  value: string | null;
  /** Why this status was assigned, e.g. "58 characters (ideal 30–60)". */
  detail: string;
}

export interface SeoReport {
  checks: SeoCheck[];
  passed: number;
  warned: number;
  failed: number;
  /** Sitemap URLs declared inside robots.txt, if any. */
  declaredSitemaps: string[];
}

/* ------------------------------------------------------------------ *
 * Images
 * ------------------------------------------------------------------ */

export interface ImageItem {
  /** Absolute URL when resolvable, otherwise the raw attribute value. */
  src: string;
  /** null means the `alt` attribute is absent entirely. */
  alt: string | null;
  /** Raw `loading` attribute value, if any. */
  loading: string | null;
  width: string | null;
  height: string | null;
  issues: string[];
}

export interface ImagesReport {
  total: number;
  missingAlt: number;
  /** `alt=""` — valid for decorative images, so reported separately. */
  emptyAlt: number;
  missingLazy: number;
  missingDimensions: number;
  items: ImageItem[];
  /** True when `items` was capped for payload size. */
  truncated: boolean;
}

/* ------------------------------------------------------------------ *
 * Internal links
 * ------------------------------------------------------------------ */

export interface LinkResult {
  url: string;
  status: number | null;
  ok: boolean;
  /** Which verb produced the result — some servers reject HEAD. */
  method: "HEAD" | "GET";
  /** Network-level failure message (timeout, DNS, refused connection). */
  error: string | null;
  /** Final URL if the request was redirected. */
  redirectedTo: string | null;
}

export interface LinksReport {
  /** Unique same-domain links found on the page. */
  found: number;
  /** How many we actually requested (capped for MVP). */
  checked: number;
  truncated: boolean;
  broken: LinkResult[];
  results: LinkResult[];
}

/* ------------------------------------------------------------------ *
 * HTML structure validation
 * ------------------------------------------------------------------ */

export interface HtmlTagNode {
  tag: string;
  text: string;
  level: number;
}

export interface HtmlReport {
  valid: boolean;
  issues: string[];
  doctypePresent: boolean;
  hasHtmlTag: boolean;
  hasHeadTag: boolean;
  hasBodyTag: boolean;
  hierarchy: HtmlTagNode[];
}

/* ------------------------------------------------------------------ *
 * Accessibility checks
 * ------------------------------------------------------------------ */

export interface AccessibilityIssue {
  label: string;
  detail: string;
  status: CheckStatus;
}

export interface AccessibilityReport {
  issues: AccessibilityIssue[];
  passed: number;
  warned: number;
  failed: number;
}

/* ------------------------------------------------------------------ *
 * Top level report
 * ------------------------------------------------------------------ */

export interface PageInfo {
  finalUrl: string;
  status: number;
  contentType: string | null;
  htmlBytes: number;
}

export interface AuditReport {
  requestedUrl: string;
  fetchedAt: string;
  durationMs: number;
  /** Details about the HTML fetch that SEO/images/links all depend on. */
  page: SectionResult<PageInfo>;
  performance: PerformanceReport;
  seo: SectionResult<SeoReport>;
  images: SectionResult<ImagesReport>;
  links: SectionResult<LinksReport>;
  html: SectionResult<HtmlReport>;
  accessibility: SectionResult<AccessibilityReport>;

  /* FUTURE MODULES — see lib/audit.ts for the plug-in points:
   * codeAudit:       SectionResult<CodeAuditReport>   (unused CSS, minification, console errors)
   * recommendations: SectionResult<AiRecommendations> (plain-English AI summary layer)
   */
}
