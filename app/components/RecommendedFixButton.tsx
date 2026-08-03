"use client";

import { useState } from "react";

export interface RecommendedFixContext {
  category: string;
  label: string;
  status?: string;
  detail: string;
  value?: string | null;
  pageUrl?: string;
}

export default function RecommendedFixButton({ context }: { context: RecommendedFixContext }) {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadRecommendation() {
    if (loading) return;

    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/recommend-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error ?? `Request failed with HTTP ${response.status}.`);
        setRecommendation(null);
        return;
      }

      setRecommendation(payload.recommendation ?? "No recommendation returned.");
    } catch {
      setError("Could not request a recommended fix. Please try again.");
      setRecommendation(null);
    } finally {
      setLoading(false);
    }
  }

  async function copyRecommendation() {
    if (!recommendation) return;

    try {
      await navigator.clipboard.writeText(recommendation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  const open = Boolean(recommendation || error);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={loadRecommendation}
        disabled={loading}
        className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? "Getting fix..." : recommendation ? "Refresh fix" : "Recommended Fix"}
      </button>

      {open ? (
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recommended fix
            </p>
            <div className="flex items-center gap-2">
              {recommendation ? (
                <button
                  type="button"
                  onClick={copyRecommendation}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                >
                  {copied ? "Copied" : "Copy to Clipboard"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setRecommendation(null);
                  setError(null);
                }}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>

          {error ? (
            <p className="mt-3 text-sm text-red-700">{error}</p>
          ) : (
            <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-700">
              {recommendation}
            </pre>
          )}
        </div>
      ) : null}
    </div>
  );
}
