"use client";

import { useEffect, useRef, useState } from "react";

import Report from "./components/Report";
import type { AuditReport } from "@/lib/types";

/** Shown one after another while the audit runs, purely so the wait feels alive. */
const PROGRESS_STEPS = [
  "Fetching the page…",
  "Running Lighthouse on mobile and desktop…",
  "Parsing meta and SEO tags…",
  "Checking images and internal links…",
  "Almost there — Lighthouse runs can take a while…",
];

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const reportRef = useRef<HTMLDivElement>(null);

  // Elapsed-seconds counter: the audit routinely takes 10–20s, so the user
  // needs to see that something is still happening.
  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [loading]);

  // Bring the fresh report into view once it lands.
  useEffect(() => {
    if (report) reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [report]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error ?? `Request failed with HTTP ${response.status}.`);
        return;
      }

      setReport(payload as AuditReport);
    } catch {
      setError("Could not reach the audit API. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const step = PROGRESS_STEPS[Math.min(Math.floor(elapsed / 4), PROGRESS_STEPS.length - 1)];

  const performanceScore = report
    ? report.performance.mobile.data?.performanceScore ?? report.performance.desktop.data?.performanceScore
    : null;
  const seoScore = report?.seo.data
    ? Math.round(
        (report.seo.data.passed /
          Math.max(1, report.seo.data.passed + report.seo.data.warned + report.seo.data.failed)) *
          100,
      )
    : null;
  const accessibilityScore = report?.accessibility.data
    ? Math.max(0, 100 - report.accessibility.data.failed * 12)
    : null;
  const securityScore = report?.security.data
    ? Math.round(
        (report.security.data.passed /
          Math.max(1, report.security.data.passed + report.security.data.warned + report.security.data.failed)) *
          100,
      )
    : null;

  const scores = [performanceScore, seoScore, accessibilityScore, securityScore].filter(
    (value): value is number => value !== null,
  );
  const overallScore = scores.length > 0 ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : null;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 sm:px-6 sm:py-14">
        <div className="overflow-hidden rounded-[2rem] glass shadow-lg">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] p-8 sm:p-10">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-violet-500 ring-1 ring-violet-500/20">
                AI Website Doctor
              </span>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate sm:text-5xl">
                  Modern website health audits, fast.
                </h1>
                <p className="mt-4 max-w-xl text-slate-500 sm:text-lg">
                  Scan any public URL to get performance, SEO, accessibility, and security insights with AI-guided remediation.
                </p>
              </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="url"
                  name="url"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com"
                  disabled={loading}
                  className="flex-1 rounded-3xl border border-gray-200 bg-white/70 px-5 py-4 text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/40 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={loading || url.trim() === ""}
                  className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4 text-sm font-semibold text-white shadow transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Analyzing…" : "Analyze Website"}
                </button>
              </form>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 text-gray/10 bg-white-950/80 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Instant insights</p>
                  <p className="mt-3 text-lg font-semibold text-slate">Performance, SEO, accessibility, security</p>
                </div>
                <div className="rounded-3xl border border-gray-200 text-gray/10 bg-white-950/80 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Built for dev teams</p>
                  <p className="mt-3 text-lg font-semibold text-slate">Actionable fixes with AI-guided recommendations</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.5rem] glass p-6 shadow-lg">
              <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.08),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.06),transparent_25%)]" />
              <div className="relative space-y-6 text-slate-900">
                <div className="rounded-3xl border border-gray-200 bg-white/70 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Live audit preview</p>
                  <p className="mt-3 text-3xl font-semibold">{overallScore ?? "–"}</p>
                  <p className="mt-2 text-sm text-slate-500">Overall health score</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-gray-200 bg-white/70 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Performance</p>
                    <p className="mt-3 text-2xl font-semibold text-emerald-600">{performanceScore ?? "–"}</p>
                  </div>
                  <div className="rounded-3xl border border-gray-200 bg-white/70 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">SEO</p>
                    <p className="mt-3 text-2xl font-semibold text-indigo-600">{seoScore ?? "–"}</p>
                  </div>
                  <div className="rounded-3xl border border-gray-200 bg-white/70 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Accessibility</p>
                    <p className="mt-3 text-2xl font-semibold text-amber-600">{accessibilityScore ?? "–"}</p>
                  </div>
                  <div className="rounded-3xl border border-gray-200 bg-white/70 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Security</p>
                    <p className="mt-3 text-2xl font-semibold text-cyan-600">{securityScore ?? "–"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10">
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-3xl border border-gray-200 text-slate-500 bg-white p-6 "
            >
              <div className="flex items-center gap-3">
                <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-gray-600 border-t-violet-400" />
                <div>
                  <p className="font-semibold text-slate-100 text-slate-400">{step}</p>
                  <p className="text-sm text-slate-400">{elapsed}s elapsed</p>
                </div>
              </div>
            </div>
          ) : null}

          {error && !loading ? (
            <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {report && !loading ? (
            <div ref={reportRef} className="mt-10 scroll-mt-6">
              <Report report={report} />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
