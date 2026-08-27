"use client";

import { useState } from "react";

import type { AuditReport } from "@/lib/types";
import { Card } from "./ui";

export default function ClientSummarySection({ report }: { report: AuditReport }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (loading) return;

    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/client-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error ?? `Request failed with HTTP ${response.status}.`);
        setSummary(null);
        return;
      }

      setSummary(payload.summary ?? "No summary returned.");
    } catch {
      setError("Could not generate a client summary. Please try again.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  async function copySummary() {
    if (!summary) return;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  return (
    <Card title="Client Summary" subtitle="A plain-English version of this report, ready to send to a client">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="cursor-pointer inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? "Writing summary…" : summary ? "Regenerate" : "Generate Client Summary"}
          </button>
          {summary ? (
            <button
              type="button"
              onClick={copySummary}
              className="cursor-pointer rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
            >
              {copied ? "Copied" : "Copy to Clipboard"}
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>
        ) : null}

        {summary ? (
          <pre className="whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-white-50 p-4 font-sans text-sm leading-relaxed text-slate-700">
            {summary}
          </pre>
        ) : !error ? (
          <p className="text-sm text-slate-500">
            Turns every finding in this report into a short, non-technical write-up — handy for sending to a client
            or stakeholder who just needs the highlights.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
