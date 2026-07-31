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

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Ai Website Doctor
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">
          Paste any public URL to get a performance, SEO, image and broken-link report in one pass.
        </p>
      </header>

      {/* Input ---------------------------------------------------------- */}
      <form onSubmit={handleSubmit} className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="url" className="sr-only">
            Website URL
          </label>
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
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={loading || url.trim() === ""}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Running…" : "Run Audit"}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500 sm:text-left">
          A full audit takes roughly 10–30 seconds — it waits on two live Lighthouse runs.
        </p>
      </form>

      {/* Loading state -------------------------------------------------- */}
      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-8 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
        >
          <span
            aria-hidden="true"
            className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"
          />
          <div>
            <p className="text-sm font-medium text-slate-900">{step}</p>
            <p className="text-xs text-slate-500 tabular-nums">{elapsed}s elapsed</p>
          </div>
        </div>
      ) : null}

      {/* Error ---------------------------------------------------------- */}
      {error && !loading ? (
        <p
          role="alert"
          className="mt-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      {/* Report --------------------------------------------------------- */}
      {report && !loading ? (
        <div ref={reportRef} className="mt-10 scroll-mt-6">
          <Report report={report} />
        </div>
      ) : null}

      <footer className="mt-14 text-center text-xs text-slate-400">
        MVP — single URL, no accounts, nothing stored. Reports are generated on demand.
      </footer>
    </main>
  );
}
