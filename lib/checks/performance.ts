/**
 * Performance check — Google PageSpeed Insights (Lighthouse) API.
 *
 * The public endpoint works without a key at low volume. Set PAGESPEED_API_KEY
 * in .env.local to raise the quota (see .env.example).
 */

import { describeFetchError, fetchWithTimeout } from "@/lib/http";
import type { PerfMetric, PerfSuggestion, Strategy, StrategyReport } from "@/lib/types";

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

/** A cold Lighthouse run on a slow site regularly takes 30s+. */
const PSI_TIMEOUT_MS = 75_000;

/** The six headline numbers we surface, in Lighthouse's own display order. */
const METRIC_AUDITS: Array<{ id: string; label: string }> = [
  { id: "first-contentful-paint", label: "First Contentful Paint" },
  { id: "largest-contentful-paint", label: "Largest Contentful Paint" },
  { id: "total-blocking-time", label: "Total Blocking Time" },
  { id: "cumulative-layout-shift", label: "Cumulative Layout Shift" },
  { id: "speed-index", label: "Speed Index" },
];

const MAX_SUGGESTIONS = 5;

/* Minimal shapes for the slice of the PSI response we read. */
interface LighthouseAudit {
  id?: string;
  title?: string;
  description?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  numericValue?: number;
  details?: { overallSavingsMs?: number; type?: string };
  metricSavings?: Record<string, number>;
}

interface PsiResponse {
  error?: { message?: string; code?: number };
  lighthouseResult?: {
    lighthouseVersion?: string;
    audits?: Record<string, LighthouseAudit>;
    categories?: {
      performance?: {
        score?: number | null;
        auditRefs?: Array<{ id: string; group?: string; weight?: number }>;
      };
    };
    runtimeError?: { code?: string; message?: string };
  };
}

/** Lighthouse descriptions are markdown; flatten links to plain text for the UI. */
function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [label](url) -> label
    .replace(/[*_`]/g, "")
    .trim();
}

function extractMetrics(audits: Record<string, LighthouseAudit>): PerfMetric[] {
  return METRIC_AUDITS.map(({ id, label }) => {
    const audit = audits[id];
    return {
      id,
      label,
      displayValue: audit?.displayValue ?? null,
      numericValue: typeof audit?.numericValue === "number" ? audit.numericValue : null,
      score: typeof audit?.score === "number" ? audit.score : null,
    };
  });
}

/**
 * Pull the top improvement opportunities out of the raw audit list.
 *
 * Lighthouse 10+ folds the old "opportunities" group into "diagnostics", so we
 * take every scored diagnostic that did not pass and rank it by the savings
 * Lighthouse estimated (falling back to the worst score).
 */
function extractSuggestions(
  audits: Record<string, LighthouseAudit>,
  auditRefs: Array<{ id: string; group?: string }>,
): PerfSuggestion[] {
  const metricIds = new Set(METRIC_AUDITS.map((m) => m.id));

  const candidates = auditRefs
    .filter((ref) => ref.group !== "metrics" && ref.group !== "hidden" && !metricIds.has(ref.id))
    .map((ref) => ({ ref, audit: audits[ref.id] }))
    .filter(({ audit }) => {
      if (!audit) return false;
      // Informative/not-applicable audits carry no score and nothing to fix.
      if (typeof audit.score !== "number") return false;
      if (audit.scoreDisplayMode === "informative" || audit.scoreDisplayMode === "notApplicable") {
        return false;
      }
      return audit.score < 0.9;
    })
    .map(({ ref, audit }) => {
      const savings =
        audit.details?.overallSavingsMs ??
        (audit.metricSavings
          ? Math.max(0, ...Object.values(audit.metricSavings).filter((n) => typeof n === "number"))
          : 0);

      return {
        id: audit.id ?? ref.id,
        title: audit.title ?? ref.id,
        description: stripMarkdown(audit.description ?? ""),
        score: audit.score ?? null,
        savingsMs: savings > 0 ? Math.round(savings) : null,
        displayValue: audit.displayValue ?? null,
      } satisfies PerfSuggestion;
    });

  candidates.sort((a, b) => {
    const savingsDelta = (b.savingsMs ?? 0) - (a.savingsMs ?? 0);
    if (savingsDelta !== 0) return savingsDelta;
    return (a.score ?? 1) - (b.score ?? 1);
  });

  return candidates.slice(0, MAX_SUGGESTIONS);
}

export async function runPageSpeed(url: string, strategy: Strategy): Promise<StrategyReport> {
  const endpoint = new URL(PSI_ENDPOINT);
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.set("category", "performance");

  const apiKey = process.env.PAGESPEED_API_KEY;
  if (apiKey) endpoint.searchParams.set("key", apiKey);

  let response: Response;
  try {
    response = await fetchWithTimeout(endpoint.toString(), {
      timeoutMs: PSI_TIMEOUT_MS,
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    throw new Error(`PageSpeed Insights request failed — ${describeFetchError(error)}.`);
  }

  let body: PsiResponse;
  try {
    body = (await response.json()) as PsiResponse;
  } catch {
    throw new Error(`PageSpeed Insights returned an unreadable response (HTTP ${response.status}).`);
  }

  if (!response.ok || body.error) {
    // Google's messages already end in a period — don't double it up.
    const message = (body.error?.message ?? `HTTP ${response.status}`).replace(/\.\s*$/, "");
    // 429 is the usual one — the keyless quota is small and shared per IP.
    const hint =
      response.status === 429 && !apiKey ? " Add a PAGESPEED_API_KEY to raise the quota." : "";
    throw new Error(`PageSpeed Insights (${strategy}): ${message}.${hint}`);
  }

  const lighthouse = body.lighthouseResult;
  if (!lighthouse) {
    throw new Error(`PageSpeed Insights (${strategy}) returned no Lighthouse result.`);
  }
  if (lighthouse.runtimeError?.code) {
    throw new Error(
      `Lighthouse could not analyse this page: ${lighthouse.runtimeError.message ?? lighthouse.runtimeError.code}`,
    );
  }

  const audits = lighthouse.audits ?? {};
  const category = lighthouse.categories?.performance;
  const rawScore = category?.score;

  return {
    strategy,
    performanceScore: typeof rawScore === "number" ? Math.round(rawScore * 100) : null,
    metrics: extractMetrics(audits),
    suggestions: extractSuggestions(audits, category?.auditRefs ?? []),
    lighthouseVersion: lighthouse.lighthouseVersion ?? null,
  };
}
