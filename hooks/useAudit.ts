"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuditReport } from "@/lib/types";
import { runAudit } from "@/services/auditService";

const PROGRESS_STEPS = [
  "Fetching the page…",
  "Running Lighthouse on mobile and desktop…",
  "Parsing meta and SEO tags…",
  "Checking images and internal links…",
  "Almost there — Lighthouse runs can take a while…",
];

export function useAudit(initialUrl = "") {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const timer = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [loading]);

  const step = useMemo(
    () => PROGRESS_STEPS[Math.min(Math.floor(elapsed / 4), PROGRESS_STEPS.length - 1)],
    [elapsed],
  );

  const run = useCallback(async (targetUrl?: string) => {
    const nextUrl = (targetUrl ?? url).trim();
    if (!nextUrl) {
      setError("Please enter a valid website URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setUrl(nextUrl);

    try {
      const auditReport = await runAudit(nextUrl);
      setReport(auditReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The audit failed unexpectedly.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  return {
    url,
    setUrl,
    loading,
    error,
    report,
    elapsed,
    step,
    run,
  };
}
